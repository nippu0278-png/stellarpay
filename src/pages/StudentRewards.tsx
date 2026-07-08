import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { simulateAndSubmitSorobanTransaction, getRpcServer } from '../services/stellar';
import { nativeToScVal, scValToNative, Contract, TransactionBuilder, Networks } from '@stellar/stellar-sdk';

interface Milestone {
  id: string;
  title: string;
  description: string;
  points: number;
  status: 'available' | 'claimed' | 'locked';
  icon: string;
  category: string;
  date: string;
}

export const StudentRewards: React.FC = () => {
  const { isConnected, publicKey, signTx, connectWallet, showToast } = useWallet();
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('stellarpay_student_name') || 'Nivriti Pandey';
  });
  const [showRegisterInput, setShowRegisterInput] = useState(false);
  const [inputName, setInputName] = useState('');

  const initialMilestones: Milestone[] = [
    { id: '1', title: 'Stellar 101 Quiz', description: 'Achieve a GPA of 3.8 or higher in the current semester.', points: 150, status: 'available', icon: 'quiz', category: 'Academic Module', date: 'Oct 24, 2023' },
    { id: '2', title: 'Workshop Attendee', description: 'Maintain 100% lecture attendance for consecutive 60 days.', points: 300, status: 'available', icon: 'groups', category: 'Campus Event', date: 'Oct 20, 2023' },
    { id: '3', title: 'Soroban Quest #1', description: 'Win 1st or 2nd place in the annual university tech hackathon.', points: 500, status: 'locked', icon: 'code', category: 'Developer Bounty', date: 'Oct 15, 2023' },
  ];

  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const saved = localStorage.getItem('stellarpay_milestones');
    return saved ? JSON.parse(saved) : initialMilestones;
  });

  const saveMilestones = (newMilestones: Milestone[]) => {
    setMilestones(newMilestones);
    localStorage.setItem('stellarpay_milestones', JSON.stringify(newMilestones));
  };

  const fetchStudentPoints = useCallback(async (key: string): Promise<number> => {
    try {
      const rpcServer = getRpcServer();
      const contractId = import.meta.env.VITE_CONTRACT_ID;
      
      const contract = new Contract(contractId);
      const op = contract.call('get_student_points', nativeToScVal(key, { type: 'address' }));
      
      const account = await rpcServer.getAccount(key);
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(op)
      .setTimeout(30)
      .build();
      
      const simulation = (await rpcServer.simulateTransaction(tx)) as any;
      if (simulation.result) {
        return scValToNative(simulation.result.retval);
      }
      return 0;
    } catch (e) {
      console.warn('Failed to fetch points from contract:', e);
      return 0;
    }
  }, []);

  const loadPoints = useCallback(async () => {
    if (!publicKey) return;
    const points = await fetchStudentPoints(publicKey);
    setPointsBalance(points);
  }, [publicKey, fetchStudentPoints]);

  useEffect(() => {
    const savedName = localStorage.getItem('stellarpay_student_name');
    if (!savedName || savedName === 'Alex Rivera') {
      localStorage.setItem('stellarpay_student_name', 'Nivriti Pandey');
      setStudentName('Nivriti Pandey');
    }
  }, []);

  useEffect(() => {
    if (isConnected && publicKey) {
      loadPoints();
    }
  }, [isConnected, publicKey, loadPoints]);

  // Handle student name registration
  const handleRegister = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    if (!inputName.trim()) {
      showToast('Please enter a name.', 'error');
      return;
    }

    setIsProcessing(true);
    setTxStatus('Initializing name registration...');
    showToast('Registering student on-chain...', 'info');

    try {
      const contractId = import.meta.env.VITE_CONTRACT_ID;
      const txHash = await simulateAndSubmitSorobanTransaction(
        publicKey!,
        contractId,
        'register_student',
        [
          nativeToScVal(publicKey!, { type: 'address' }),
          nativeToScVal(inputName.trim(), { type: 'string' })
        ],
        signTx,
        setTxStatus
      );
      showToast(`Student registered successfully! Hash: ${txHash.substring(0, 8)}...`, 'success');
      setStudentName(inputName.trim());
      localStorage.setItem('stellarpay_student_name', inputName.trim());
      setShowRegisterInput(false);
      setInputName('');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsProcessing(false);
      setTxStatus('');
    }
  };

  // Earn/Mint points for a milestone
  const handleEarnPoints = async (milestoneId: string, points: number) => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    setIsProcessing(true);
    setTxStatus('Preparing points award...');
    showToast(`Minting ${points} academic points on-chain...`, 'info');

    try {
      const contractId = import.meta.env.VITE_CONTRACT_ID;
      const txHash = await simulateAndSubmitSorobanTransaction(
        publicKey!,
        contractId,
        'reward_student',
        [
          nativeToScVal(publicKey!, { type: 'address' }),
          nativeToScVal(points, { type: 'u32' })
        ],
        signTx,
        setTxStatus
      );
      showToast(`Earned ${points} points! Hash: ${txHash.substring(0, 8)}...`, 'success');
      
      const updated = milestones.map(m => m.id === milestoneId ? { ...m, status: 'claimed' as const } : m);
      saveMilestones(updated);
      await loadPoints();
    } catch (err: any) {
      showToast(err.message || 'Failed to award points', 'error');
    } finally {
      setIsProcessing(false);
      setTxStatus('');
    }
  };

  // Claim/Spend points on reward item
  const handleClaimReward = async (cost: number, itemName: string) => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    const currentPoints = isConnected ? pointsBalance : 500;
    if (currentPoints < cost) {
      showToast(`Insufficient points! You need ${cost} PTS to claim the ${itemName}.`, 'error');
      return;
    }

    setIsProcessing(true);
    setTxStatus('Redeeming rewards item...');
    showToast(`Redeeming points for ${itemName}...`, 'info');

    try {
      const contractId = import.meta.env.VITE_CONTRACT_ID;
      const txHash = await simulateAndSubmitSorobanTransaction(
        publicKey!,
        contractId,
        'claim_reward',
        [
          nativeToScVal(publicKey!, { type: 'address' }),
          nativeToScVal(cost, { type: 'u32' })
        ],
        signTx,
        setTxStatus
      );
      showToast(`Claimed ${itemName} successfully! Hash: ${txHash.substring(0, 8)}...`, 'success');
      await loadPoints();
    } catch (err: any) {
      showToast(err.message || 'Redemption failed', 'error');
    } finally {
      setIsProcessing(false);
      setTxStatus('');
    }
  };

  const displayPoints = isConnected ? pointsBalance : 325;

  return (
    <div className="space-y-stack-lg animate-fade-in-up text-white pb-8">
      {/* Syncing Overlay Loader */}
      {isProcessing && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-6 bg-white dark:bg-[#12141a] p-8 rounded-lg border border-gray-200 dark:border-gray-800 shadow-2xl max-w-sm w-full text-center">
            <div className="flex gap-2 justify-center mb-2">
              <div className="w-3.5 h-3.5 rounded-full bg-black dark:bg-white animate-bounce"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-black/60 dark:bg-white/60 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-black/30 dark:bg-white/30 animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <p className="font-semibold text-lg text-gray-900 dark:text-white">Processing Transaction</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono break-all">{txStatus}</p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-lg mb-12">
        <div className="max-w-2xl">
          <nav className="flex gap-2 mb-4">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-sm text-label-sm border border-primary/20">Program Active</span>
            <span className="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full font-label-sm text-label-sm border border-tertiary/20">Soroban Powered</span>
          </nav>
          <h2 className="font-display text-4xl md:text-display text-gradient mb-4">Student Rewards Program</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Unlock exclusive academic perks and digital assets by completing educational milestones and participating in the Stellar ecosystem.</p>
        </div>
        <div className="glass-card p-6 rounded-3xl flex items-center gap-6 shadow-xl border-white/5 min-w-[280px]">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Global Earnings</p>
            <p className="font-headline-lg text-headline-lg font-bold text-on-surface">12.8M <span className="text-primary font-normal text-headline-md">PTS</span></p>
          </div>
        </div>
      </header>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Student Status Card */}
        <section className="md:col-span-4 flex flex-col gap-gutter">
          <div className="glass-card p-stack-lg rounded-[32px] flex flex-col gap-6 relative overflow-hidden group border-white/5">
            {/* Subtle background decoration */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 blur-[64px] group-hover:bg-primary/30 transition-all"></div>
            
            <div className="flex items-center justify-between">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/30 bg-surface-container-low flex-shrink-0">
                <img className="w-full h-full object-cover" alt="Student NFT Avatar" src="/student_profile_avatar.png" />
              </div>
              <div className="text-right">
                <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            </div>

            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">{studentName}</h3>
              <p className="text-on-surface-variant font-label-md text-label-md">Computer Science • Junior</p>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex justify-between items-end mb-2">
                <p className="font-label-sm text-label-sm text-on-surface-variant">Wallet Balance</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                  <span className="font-label-sm text-label-sm text-tertiary">Live Fetching</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-3xl font-bold text-on-surface" id="points-display">{displayPoints}</span>
                <span className="text-primary font-bold">PTS</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                <div className="h-full primary-gradient rounded-full" style={{ width: `${Math.min((displayPoints / 500) * 100, 100)}%` }}></div>
              </div>
              <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant text-right">
                250 PTS to next tier (Gold Scholar)
              </p>
            </div>
          </div>

          {/* Action Panel */}
          <div className="glass-card p-stack-lg rounded-[32px] flex flex-col gap-4 border-white/5">
            <h4 className="font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface-variant mb-2">Rewards Actions</h4>
            
            {showRegisterInput ? (
              <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-2xl border border-white/10">
                <input
                  type="text"
                  placeholder="Enter Student Name"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm w-full placeholder:text-on-surface-variant/40 text-white focus:outline-none focus:border-primary"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowRegisterInput(false)}
                    className="px-3 py-1.5 bg-white/5 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegister}
                    className="px-3 py-1.5 bg-primary rounded-lg text-xs font-bold text-white"
                  >
                    Register
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRegisterInput(true)}
                className="w-full py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-on-surface font-bold font-label-md text-label-md flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">school</span>
                Register as Student
              </button>
            )}

            <button
              onClick={() => handleClaimReward(200, 'Academic Milestone Certificate')}
              className="primary-gradient w-full py-4 px-6 rounded-2xl text-white font-bold font-label-md text-label-md flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-95"
            >
              <span className="material-symbols-outlined">redeem</span>
              Claim Rewards
            </button>

            <p className="text-[11px] text-center text-on-surface-variant mt-2 px-4">
              Transactions are verified on the Stellar network using Soroban smart contracts for maximum transparency.
            </p>
          </div>
        </section>

        {/* Reward History & Bento Items */}
        <section className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {/* Large Reward History Card */}
          <div className="md:col-span-2 glass-card rounded-[32px] overflow-hidden flex flex-col border-white/5">
            <div className="p-stack-lg border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">history</span>
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Reward History</h3>
              </div>
              <button className="text-primary font-label-md text-label-md hover:underline decoration-2 underline-offset-4">View All</button>
            </div>
            
            <div className="flex-1 max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#10131a] z-10">
                  <tr className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="px-stack-lg py-4">Event</th>
                    <th className="px-stack-lg py-4">Date</th>
                    <th className="px-stack-lg py-4">Status</th>
                    <th className="px-stack-lg py-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {milestones.map((m) => {
                    const isClaimed = m.status === 'claimed';
                    const isLocked = m.status === 'locked';

                    return (
                      <tr 
                        key={m.id} 
                        className={`hover:bg-white/5 transition-colors group cursor-pointer ${isClaimed ? 'opacity-70' : ''}`}
                        onClick={() => {
                          if (m.status === 'available') {
                            handleEarnPoints(m.id, m.points);
                          } else if (isLocked) {
                            showToast('This academic milestone is currently locked.', 'error');
                          }
                        }}
                      >
                        <td className="px-stack-lg py-5 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            m.icon === 'quiz' ? 'bg-tertiary/10 text-tertiary' :
                            m.icon === 'groups' ? 'bg-primary/10 text-primary' : 'bg-white/5 text-on-surface-variant'
                          }`}>
                            <span className="material-symbols-outlined">{m.icon}</span>
                          </div>
                          <div>
                            <p className="font-label-md text-label-md text-on-surface font-bold">{m.title}</p>
                            <p className="text-[12px] text-on-surface-variant">{m.category}</p>
                          </div>
                        </td>
                        <td className="px-stack-lg py-5 text-on-surface-variant font-label-sm text-label-sm">{m.date}</td>
                        <td className="px-stack-lg py-5">
                          {isClaimed ? (
                            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 font-label-sm text-label-sm border border-green-500/20">Sent</span>
                          ) : isLocked ? (
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm border border-primary/20">Pending</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-label-sm text-label-sm border border-primary/30 group-hover:bg-primary group-hover:text-white transition-colors">
                              Claim (+{m.points})
                            </span>
                          )}
                        </td>
                        <td className="px-stack-lg py-5 text-right font-bold text-primary font-headline-md text-headline-md">+{m.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Featured Reward Card */}
          <div className="glass-card p-6 rounded-[32px] flex flex-col gap-4 relative overflow-hidden group border-white/5">
            <div className="w-full h-40 rounded-2xl bg-cover bg-center mb-2 bg-[#191c22]" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBXQxUjVg8Bb92aVJt9hmLfKLz6tS4lIaEkAWRFeOee6UH6JJ7haOuWuffsSgpZNuOqlS0cmKbfoeI9u4iqY9bmghxBXYafr4NXuLgseAt1C8cHfgrmQwFggN4yUBq8lsopkHiFIx0GwfTgIwq6DhG5aMR1YVT__gFUJq5jldLogPTeHNzzMVjVER-NUjSQgFC8GOlMwk1IO06XWicMgY5wdxuZObb8C_Bd4_hxbHQaKMH9xvKK9la3iZnsAtwAt4vY8xj9LMVjEiQ')" }}></div>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-headline-md text-headline-md text-on-surface font-bold">Digital Mentor NFT</h4>
                <p className="font-label-sm text-label-sm text-tertiary">Limited Edition Reward</p>
              </div>
              <span className="bg-primary/20 text-primary px-2 py-1 rounded-lg font-bold text-sm">2.5k PTS</span>
            </div>
            <p className="text-on-surface-variant text-sm line-clamp-2">Exclusive access to the private developer workshop series and a unique Soulbound token.</p>
            <button
              onClick={() => handleClaimReward(2500, 'Digital Mentor NFT')}
              className="mt-auto py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-on-surface font-bold transition-all active:scale-95"
            >
              Unlock Item
            </button>
          </div>

          {/* Program Stats Card */}
          <div className="glass-card p-6 rounded-[32px] flex flex-col justify-between border-white/5">
            <div>
              <h4 className="font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface-variant mb-6">Program Impact</h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">school</span>
                  </div>
                  <div>
                    <p className="text-headline-md font-bold text-on-surface">450+</p>
                    <p className="text-label-sm text-on-surface-variant">Registered Institutions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined">auto_graph</span>
                  </div>
                  <div>
                    <p className="text-headline-md font-bold text-on-surface">1.2M XLM</p>
                    <p className="text-label-sm text-on-surface-variant">Distributed in Grants</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-xs text-primary/80 italic font-medium">"Transforming academic achievement into tangible digital value."</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
