import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { simulateAndSubmitSorobanTransaction, getRpcServer } from '../services/stellar';
import { nativeToScVal, scValToNative, Contract, TransactionBuilder, Networks } from '@stellar/stellar-sdk';

interface LogEntry {
  timestamp: string;
  type: 'TX_SUCCESS' | 'EVENT_EMITTED' | 'ERROR' | 'PENDING';
  method: string;
  hash?: string;
  payload: any;
}

export const ContractExplorer: React.FC = () => {
  const { isConnected, publicKey, signTx, showToast } = useWallet();
  const contractId = import.meta.env.VITE_CONTRACT_ID;

  // Accordion state
  const [openPanel, setOpenPanel] = useState<string | null>('register');

  // Input states
  const [registerWallet, setRegisterWallet] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [metadataHash, setMetadataHash] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const [rewardWallet, setRewardWallet] = useState('');
  const [rewardPoints, setRewardPoints] = useState('');

  const [queryWallet, setQueryWallet] = useState('');

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'TX_SUCCESS',
      method: 'SystemVM_Init',
      payload: { status: 'OK', contract_id: contractId }
    }
  ]);

  const addLogEntry = (type: LogEntry['type'], method: string, payload: any, hash?: string) => {
    setLogs((prev) => [
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        method,
        hash,
        payload
      },
      ...prev
    ]);
  };

  // 1. register_student
  const handleRegister = async () => {
    if (!isConnected || !publicKey) {
      showToast('Wallet not connected', 'error');
      return;
    }
    
    const targetWallet = registerWallet.trim() || publicKey;
    const targetName = registerName.trim();
    if (!targetName) {
      showToast('Please enter a student name', 'error');
      return;
    }

    addLogEntry('PENDING', 'register_student', { student: targetWallet, name: targetName });
    showToast('Submitting registration...', 'info');

    try {
      const hash = await simulateAndSubmitSorobanTransaction(
        publicKey,
        contractId,
        'register_student',
        [
          nativeToScVal(targetWallet, { type: 'address' }),
          nativeToScVal(targetName, { type: 'string' })
        ],
        signTx
      );
      addLogEntry('TX_SUCCESS', 'register_student', {
        status: 'OK',
        student: targetWallet,
        name: targetName,
        metadata_hash: metadataHash || undefined,
        referral: referralCode || undefined
      }, hash);
      showToast('Student Registered Successfully!', 'success');
      setRegisterName('');
      setRegisterWallet('');
      setMetadataHash('');
      setReferralCode('');
    } catch (err: any) {
      addLogEntry('ERROR', 'register_student', { error: err.message || 'Execution failed' });
      showToast(err.message || 'Registration failed', 'error');
    }
  };

  // 2. reward_student
  const handleReward = async () => {
    if (!isConnected || !publicKey) {
      showToast('Wallet not connected', 'error');
      return;
    }
    const targetWallet = rewardWallet.trim();
    const pointsStr = rewardPoints.trim();
    if (!targetWallet || !pointsStr) {
      showToast('Please fill in recipient address and points', 'error');
      return;
    }

    const pts = parseInt(pointsStr);
    if (isNaN(pts) || pts <= 0) {
      showToast('Points must be a positive number', 'error');
      return;
    }

    addLogEntry('PENDING', 'reward_student', { recipient: targetWallet, points: pts });
    showToast('Awarding points...', 'info');

    try {
      const hash = await simulateAndSubmitSorobanTransaction(
        publicKey,
        contractId,
        'reward_student',
        [
          nativeToScVal(targetWallet, { type: 'address' }),
          nativeToScVal(pts, { type: 'u32' })
        ],
        signTx
      );
      addLogEntry('TX_SUCCESS', 'reward_student', {
        status: 'OK',
        recipient: targetWallet,
        points_awarded: pts
      }, hash);
      showToast('Academic Rewards Minted!', 'success');
      setRewardWallet('');
      setRewardPoints('');
    } catch (err: any) {
      addLogEntry('ERROR', 'reward_student', { error: err.message || 'Execution failed' });
      showToast(err.message || 'Reward submission failed', 'error');
    }
  };

  // 3. get_student_points
  const handleQueryPoints = async () => {
    const targetWallet = queryWallet.trim() || publicKey;
    if (!targetWallet) {
      showToast('Please enter a wallet address', 'error');
      return;
    }

    addLogEntry('PENDING', 'get_student_points', { query_wallet: targetWallet });

    try {
      const rpcServer = getRpcServer();
      const contract = new Contract(contractId);
      const op = contract.call('get_student_points', nativeToScVal(targetWallet, { type: 'address' }));
      
      const sender = publicKey || targetWallet;
      const account = await rpcServer.getAccount(sender);
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(op)
      .setTimeout(30)
      .build();
      
      const simulation = (await rpcServer.simulateTransaction(tx)) as any;
      if (simulation.result) {
        const val = scValToNative(simulation.result.retval);
        addLogEntry('EVENT_EMITTED', 'get_student_points', {
          wallet: targetWallet,
          points_balance: val
        });
        showToast(`Student Balance: ${val} Points`, 'success');
        setQueryWallet('');
      } else {
        throw new Error(simulation.error || 'Failed simulation check');
      }
    } catch (err: any) {
      addLogEntry('ERROR', 'get_student_points', { error: err.message || 'Execution failed' });
      showToast('Query failed', 'error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(contractId);
    showToast('Contract ID copied!', 'success');
  };

  return (
    <div className="space-y-stack-lg animate-fade-in-up text-white pb-8">
      {/* Contract ID Header Card */}
      <section className="mb-stack-lg">
        <div className="glass-card rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 overflow-hidden relative border-white/5">
          {/* Atmospheric background element */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
          <div className="z-10 w-full lg:w-auto">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-1 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase tracking-widest border border-primary/20">Soroban Contract</span>
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-[12px] font-bold uppercase">Active</span>
              </div>
            </div>
            <h3 className="font-headline-lg-mobile lg:font-headline-lg text-on-surface break-all lg:break-normal font-bold">
              CDE...789XYZ_STPay_Core
            </h3>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <code className="text-[13px] bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-on-surface-variant font-mono break-all max-w-[280px] sm:max-w-none">
                {contractId}
              </code>
              <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-primary flex items-center gap-2 active:scale-95">
                <span className="material-symbols-outlined text-[20px]">content_copy</span>
                <span className="text-[12px] font-bold uppercase tracking-wide">Copy ID</span>
              </button>
            </div>
          </div>
          <div className="z-10 flex gap-4 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none bg-black/20 p-4 rounded-xl border border-white/5 text-center min-w-[100px]">
              <p className="text-[11px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Total Calls</p>
              <p className="text-2xl font-bold text-on-surface">1.2M</p>
            </div>
            <div className="flex-1 lg:flex-none bg-black/20 p-4 rounded-xl border border-white/5 text-center min-w-[100px]">
              <p className="text-[11px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Gas Used</p>
              <p className="text-2xl font-bold text-tertiary">42.8 Gwei</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Side: Function Call Interface */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-headline-md text-on-surface font-bold">Contract Functions</h4>
            <span className="text-[12px] text-on-surface-variant">7 Executable Hooks Found</span>
          </div>

          {/* Function: register_student */}
          <div className="glass-card rounded-xl overflow-hidden border-white/5">
            <button 
              className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/5"
              onClick={() => setOpenPanel(openPanel === 'register' ? null : 'register')}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface font-bold">register_student</p>
                  <p className="text-[12px] text-on-surface-variant">Registers a new wallet address to the rewards program</p>
                </div>
              </div>
              <span className={`material-symbols-outlined transition-transform duration-300 ${openPanel === 'register' ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {openPanel === 'register' && (
              <div className="p-5 pt-2 border-t border-white/5 bg-[#10131a]/40">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-on-surface-variant uppercase ml-1">Student Wallet (Address)</label>
                    <input 
                      type="text" 
                      value={registerWallet}
                      onChange={(e) => setRegisterWallet(e.target.value)}
                      placeholder="G... (leave blank for self)"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-on-surface text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-on-surface-variant uppercase ml-1">Student Name</label>
                    <input 
                      type="text" 
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-on-surface text-sm"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-on-surface-variant uppercase ml-1">Metadata Hash</label>
                      <input 
                        type="text" 
                        value={metadataHash}
                        onChange={(e) => setMetadataHash(e.target.value)}
                        placeholder="0x..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-on-surface text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-on-surface-variant uppercase ml-1">Referral Code</label>
                      <input 
                        type="text" 
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        placeholder="Optional"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-on-surface text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">info</span>
                      <span className="text-[12px]">Est. Cost: 0.002 XLM</span>
                    </div>
                    <button 
                      type="submit"
                      className="px-6 py-2.5 bg-primary-container text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-sm"
                    >
                      Invoke Function
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Function: reward_student */}
          <div className="glass-card rounded-xl overflow-hidden border-white/5">
            <button 
              className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/5"
              onClick={() => setOpenPanel(openPanel === 'reward' ? null : 'reward')}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">military_tech</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface font-bold">reward_student</p>
                  <p className="text-[12px] text-on-surface-variant">Allocates tokens based on curriculum completion</p>
                </div>
              </div>
              <span className={`material-symbols-outlined transition-transform duration-300 ${openPanel === 'reward' ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {openPanel === 'reward' && (
              <div className="p-5 pt-2 border-t border-white/5 bg-[#10131a]/40">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleReward(); }}>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-on-surface-variant uppercase ml-1">Recipient Wallet Address</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={rewardWallet}
                        onChange={(e) => setRewardWallet(e.target.value)}
                        placeholder="G..."
                        className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-on-surface text-sm"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setRewardWallet(publicKey || '')}
                        className="px-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold transition-all active:scale-95 text-on-surface"
                      >
                        Me
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-on-surface-variant uppercase ml-1">Reward Points</label>
                    <input 
                      type="number" 
                      value={rewardPoints}
                      onChange={(e) => setRewardPoints(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-on-surface text-sm"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-3 bg-primary-container text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-sm mt-4"
                  >
                    Invoke Function
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Function: get_student_points */}
          <div className="glass-card rounded-xl overflow-hidden border-white/5">
            <button 
              className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/5"
              onClick={() => setOpenPanel(openPanel === 'query' ? null : 'query')}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">stars</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface font-bold">get_student_points</p>
                  <p className="text-[12px] text-on-surface-variant">Retrieves points balance for a student address (Read Only)</p>
                </div>
              </div>
              <span className={`material-symbols-outlined transition-transform duration-300 ${openPanel === 'query' ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {openPanel === 'query' && (
              <div className="p-5 pt-2 border-t border-white/5 bg-[#10131a]/40">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleQueryPoints(); }}>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-on-surface-variant uppercase ml-1">Student Wallet Address</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={queryWallet}
                        onChange={(e) => setQueryWallet(e.target.value)}
                        placeholder="G..."
                        className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-on-surface text-sm"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setQueryWallet(publicKey || '')}
                        className="px-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold transition-all active:scale-95 text-on-surface"
                      >
                        Me
                      </button>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-3 bg-secondary-container text-white rounded-xl font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all text-sm mt-4"
                  >
                    Call Query Function
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Function: update_contract_metadata */}
          <div className="glass-card rounded-xl overflow-hidden border-white/5 opacity-70">
            <button 
              className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/5"
              onClick={() => setOpenPanel(openPanel === 'admin' ? null : 'admin')}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-on-surface-variant/10 flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined">data_object</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface font-bold">update_contract_metadata</p>
                  <p className="text-[12px] text-on-surface-variant">Admin-only function to update system parameters</p>
                </div>
              </div>
              <span className={`material-symbols-outlined transition-transform duration-300 ${openPanel === 'admin' ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {openPanel === 'admin' && (
              <div className="p-5 pt-2 border-t border-white/5 bg-[#10131a]/40">
                <div className="flex items-center gap-2 bg-error-container/20 p-3 rounded-lg border border-error/20 mb-4 text-error">
                  <span className="material-symbols-outlined text-error">warning</span>
                  <span className="text-xs text-on-error-container">This function requires Admin Signature (Multi-sig).</span>
                </div>
                <button 
                  type="button" 
                  className="w-full py-3 bg-on-surface-variant/10 text-on-surface-variant rounded-xl font-bold transition-all cursor-not-allowed text-sm"
                  disabled
                >
                  Authorization Required
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live Logs Terminal */}
        <div className="xl:col-span-5 flex flex-col gap-4 h-full min-h-[500px]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-headline-md text-on-surface font-bold">Live Execution Log</h4>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Streaming</span>
            </div>
          </div>
          <div className="glass-card rounded-xl flex-1 flex flex-col overflow-hidden border-white/5 bg-black/40">
            {/* Terminal Header */}
            <div className="bg-black/40 border-b border-white/5 p-4 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-error/40"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400/40"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/40"></div>
              </div>
              <button 
                onClick={() => setLogs([])}
                className="text-on-surface-variant hover:text-primary transition-colors active:scale-95"
                title="Clear Logs"
              >
                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
              </button>
            </div>
            {/* Terminal Body */}
            <div className="flex-1 p-4 overflow-y-auto text-[13px] custom-scrollbar space-y-4 max-h-[380px] bg-[rgba(5,7,10,0.8)] font-mono">
              {logs.map((log, idx) => (
                <div key={idx} className="space-y-2 pt-2 border-t border-white/5 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${
                      log.type === 'TX_SUCCESS' ? 'text-primary' : 
                      log.type === 'EVENT_EMITTED' ? 'text-tertiary' :
                      log.type === 'ERROR' ? 'text-red-400' : 'text-[#ccc3d8] animate-pulse'
                    }`}>
                      {log.timestamp} - [{log.type}]
                    </span>
                    {log.hash && (
                      <span className="text-[10px] text-on-surface-variant opacity-50">Hash: {log.hash.substring(0, 8)}...</span>
                    )}
                  </div>
                  <pre className="text-on-surface-variant leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
            {/* Terminal Footer */}
            <div className="p-3 bg-black/40 border-t border-white/5 flex items-center gap-4">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '12%' }}></div>
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Load: 12%</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Stats Footer Grid */}
      <section className="mt-stack-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border-white/5">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase mb-2 tracking-widest">Network Speed</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-on-surface">3.2s</span>
            <span className="text-green-500 text-xs mb-1 font-bold">+12%</span>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 border-white/5">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase mb-2 tracking-widest">Storage Used</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-on-surface">148MB</span>
            <span className="text-on-surface-variant text-xs mb-1">of 1GB</span>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 border-white/5">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase mb-2 tracking-widest">Auth Schema</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-on-surface">Ed25519</span>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 border-primary/20">
          <p className="text-[11px] font-bold text-primary uppercase mb-2 tracking-widest">Admin Keys</p>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary-container border-2 border-background flex items-center justify-center text-[10px] font-bold">MK</div>
              <div className="w-8 h-8 rounded-full bg-secondary-container border-2 border-background flex items-center justify-center text-[10px] font-bold">JD</div>
              <div className="w-8 h-8 rounded-full bg-tertiary-container border-2 border-background flex items-center justify-center text-[10px] font-bold">AS</div>
            </div>
            <span className="text-[12px] font-bold text-on-surface ml-2 font-bold font-sans">3 Signers</span>
          </div>
        </div>
      </section>
    </div>
  );
};
