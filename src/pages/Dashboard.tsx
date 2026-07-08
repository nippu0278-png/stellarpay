import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { fetchRecentPayments, fetchXlmPriceUsd } from '../services/stellar';

export const Dashboard: React.FC = () => {
  const { publicKey, isConnected, balance, network, refreshBalance, connectWallet } = useWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  const navigate = useNavigate();

  // Dynamic state
  const [payments, setPayments] = useState<any[]>([]);
  const [xlmPrice, setXlmPrice] = useState<number>(0.12);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!publicKey) return;
    setIsLoadingPayments(true);
    try {
      const [history, price] = await Promise.all([
        fetchRecentPayments(publicKey),
        fetchXlmPriceUsd()
      ]);
      setPayments(history);
      setXlmPrice(price);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setIsLoadingPayments(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (isConnected && publicKey) {
      loadDashboardData();
    }
  }, [publicKey, isConnected, loadDashboardData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshBalance(),
      loadDashboardData()
    ]);
    setIsRefreshing(false);
  };

  const handleCopy = () => {
    const addressToCopy = publicKey || 'GC74K2H1D9W1R4S5P9L0F8K';
    navigator.clipboard.writeText(addressToCopy);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const truncateAddress = (addr: string | null) => {
    if (!addr) return 'GC...4F8K';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Mock transactions corresponding to mockup dashboard HTML
  const mockPayments = [
    {
      id: 'mock1',
      description: 'Sent to GDS2...X9W',
      timeStr: 'Today, 2:45 PM',
      isSent: true,
      amount: '50.00',
      status: 'Success'
    },
    {
      id: 'mock2',
      description: 'Stellar Faucet Drop',
      timeStr: 'Yesterday, 10:12 AM',
      isSent: false,
      amount: '10,000.00',
      status: 'Success'
    },
    {
      id: 'mock3',
      description: 'Swap XLM to USDC',
      timeStr: 'Oct 24, 2023',
      isSent: false,
      amount: '120.00',
      status: 'Failed'
    }
  ];

  const displayBalance = isConnected && balance !== null 
    ? parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
    : '1,240.50';

  const displayUsdValue = isConnected && balance !== null 
    ? (parseFloat(balance) * xlmPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '148.86';

  return (
    <div className="space-y-stack-lg animate-fade-in-up">
      <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Wallet Overview (Main Focus) */}
        <div className="md:col-span-7 glass-card rounded-3xl p-stack-lg relative overflow-hidden group border-white/5 text-white">
          {/* Decorative Gradient */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] pointer-events-none group-hover:bg-primary/30 transition-colors"></div>
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-1">Total Balance</p>
              <h3 className="font-display text-[42px] leading-none mb-2 text-white">
                {displayBalance} <span className="text-primary font-bold">XLM</span>
              </h3>
              <p className="text-on-surface-variant flex items-center gap-1.5 mt-2">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span className="font-label-sm text-label-sm font-mono mr-1">
                  {truncateAddress(publicKey)}
                </span>
                <button
                  onClick={handleCopy}
                  className="hover:text-white transition-colors p-1 flex items-center active:scale-90"
                  title="Copy Address"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copyStatus ? 'check' : 'content_copy'}
                  </span>
                </button>
              </p>
            </div>
            {isConnected ? (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-tertiary/10 border border-tertiary/20 text-tertiary px-4 py-2 rounded-2xl flex items-center gap-2 font-label-md text-label-md hover:bg-tertiary/25 transition-all"
              >
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75 ${isRefreshing ? 'animate-spin' : ''}`}></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary"></span>
                </span>
                <span className="font-label-md text-label-md font-bold">{isRefreshing ? 'Syncing...' : 'Connected'}</span>
              </button>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-primary/20 border border-primary/40 text-primary px-4 py-2 rounded-2xl flex items-center gap-2 font-label-md text-label-md hover:bg-primary/30 transition-all font-bold active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">link</span>
                <span>Connect</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-stack-md pt-4 border-t border-white/5">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Est. Value</p>
              <p className="font-headline-md text-headline-md text-white">
                ${displayUsdValue} USD
              </p>
            </div>
            <div className="text-right">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Network</p>
              <p className="font-headline-md text-headline-md text-tertiary uppercase">
                {isConnected ? (network || 'Testnet') : 'Horizon v2.0'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Bento */}
        <div className="md:col-span-5 grid grid-cols-2 gap-gutter">
          <button
            onClick={() => navigate('/send')}
            className="glass-card rounded-3xl p-stack-md flex flex-col items-center justify-center gap-2 group hover:bg-primary/5 transition-all active:scale-95 border-b-4 border-b-primary/40 border-white/5 text-white"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">send</span>
            </div>
            <span className="font-label-md text-label-md font-bold">Send XLM</span>
          </button>
          <button
            onClick={() => navigate('/rewards')}
            className="glass-card rounded-3xl p-stack-md flex flex-col items-center justify-center gap-2 group hover:bg-secondary/5 transition-all active:scale-95 border-b-4 border-b-secondary/40 border-white/5 text-white"
          >
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">star</span>
            </div>
            <span className="font-label-md text-label-md font-bold">Rewards</span>
          </button>
          <button
            onClick={() => navigate('/events')}
            className="glass-card rounded-3xl p-stack-md flex flex-col items-center justify-center gap-2 group hover:bg-tertiary/5 transition-all active:scale-95 border-b-4 border-b-tertiary/40 col-span-2 border-white/5 text-white"
          >
            <div className="w-10 h-10 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">event</span>
            </div>
            <span className="font-label-md text-label-md font-bold">Upcoming Events</span>
          </button>
        </div>
      </section>

      {/* Secondary Row: Activity & Network */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Recent Activity List */}
        <div className="md:col-span-8 glass-card rounded-3xl p-stack-lg border-white/5 text-white">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-headline-md text-headline-md font-bold">Recent Activity</h4>
            <button
              onClick={() => navigate('/events')}
              className="text-primary font-label-md text-label-md hover:underline"
            >
              View Ledger
            </button>
          </div>
          <div className="space-y-1">
            {isLoadingPayments ? (
              <div className="p-4 space-y-4">
                <div className="skeleton h-12 w-full rounded-2xl"></div>
                <div className="skeleton h-12 w-full rounded-2xl"></div>
                <div className="skeleton h-12 w-full rounded-2xl"></div>
              </div>
            ) : (!isConnected || payments.length === 0) ? (
              // Fallback mockup transactions list
              mockPayments.map((p, idx) => (
                <React.Fragment key={p.id}>
                  <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        p.isSent ? 'bg-error-container/20 text-error' : 'bg-tertiary-container/20 text-tertiary'
                      }`}>
                        <span className="material-symbols-outlined">
                          {p.isSent ? 'arrow_outward' : 'call_received'}
                        </span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md font-bold">{p.description}</p>
                        <p className="text-[12px] text-on-surface-variant">{p.timeStr}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-label-md text-label-md font-bold ${
                        p.isSent ? 'text-error' : 'text-tertiary'
                      }`}>
                        {p.isSent ? '-' : '+'} {p.amount} XLM
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                        p.status === 'Success' ? 'bg-secondary-container/10 text-secondary-container' : 'bg-outline/10 text-outline'
                      }`}>{p.status}</span>
                    </div>
                  </div>
                  {idx < mockPayments.length - 1 && <div className="h-px bg-white/5 mx-4"></div>}
                </React.Fragment>
              ))
            ) : (
              payments.map((p, idx) => {
                const isSent = p.type === 'create_account' 
                  ? p.funder === publicKey 
                  : p.from === publicKey;
                const amount = p.type === 'create_account' ? p.starting_balance : p.amount;
                const otherParty = p.type === 'create_account'
                  ? (isSent ? p.account : p.funder)
                  : (isSent ? p.to : p.from);
                const truncateParty = otherParty 
                  ? `${otherParty.substring(0, 6)}...${otherParty.substring(otherParty.length - 4)}`
                  : 'Stellar Network';
                  
                const timeStr = p.created_at 
                  ? new Date(p.created_at).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })
                  : 'Recent';

                let description = '';
                if (p.type === 'create_account') {
                  description = isSent ? `Funded Wallet ${truncateParty}` : 'Stellar Faucet Drop';
                } else {
                  description = isSent ? `Sent to ${truncateParty}` : `Received from ${truncateParty}`;
                }

                return (
                  <React.Fragment key={p.id}>
                    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSent ? 'bg-error-container/20 text-error' : 'bg-tertiary-container/20 text-tertiary'
                        }`}>
                          <span className="material-symbols-outlined">
                            {isSent ? 'arrow_outward' : 'call_received'}
                          </span>
                        </div>
                        <div>
                          <p className="font-label-md text-label-md font-bold">{description}</p>
                          <p className="text-[12px] text-on-surface-variant">{timeStr}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-label-md text-label-md font-bold ${
                          isSent ? 'text-error' : 'text-tertiary'
                        }`}>
                          {isSent ? '-' : '+'} {parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} XLM
                        </p>
                        <span className="text-[10px] bg-secondary-container/10 text-secondary-container px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Success</span>
                      </div>
                    </div>
                    {idx < payments.length - 1 && <div className="h-[1px] bg-white/5 mx-4"></div>}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>

        {/* Network Status Card */}
        <div className="md:col-span-4 flex flex-col gap-gutter text-white">
          <div className="glass-card rounded-3xl p-stack-lg flex-1 border-white/5">
            <h4 className="font-label-md text-label-md font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">hub</span>
              Network Health
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Status</span>
                <span className="font-label-sm text-label-sm font-bold text-tertiary">Healthy</span>
              </div>
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div className="bg-tertiary h-full w-[98%]"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">Ops/Sec</p>
                  <p className="font-headline-md text-headline-md text-white font-bold">248</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">Fee</p>
                  <p className="font-headline-md text-headline-md text-white font-bold">100<span className="text-label-sm text-xs text-on-surface-variant"> stroops</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#32353c] rounded-3xl p-6 border border-white/5">
            <h4 className="font-label-md text-label-md font-bold mb-3">Community Reward</h4>
            <p className="text-label-sm text-on-surface-variant mb-4 leading-relaxed">Stake your XLM to earn up to 5.2% APR in weekly rewards.</p>
            <button
              onClick={() => navigate('/rewards')}
              className="w-full py-2 bg-white/5 border border-white/10 rounded-xl font-label-md text-label-md hover:bg-white/10 transition-all text-white active:scale-95"
            >
              Start Staking
            </button>
          </div>
        </div>
      </section>

      {/* Loading Skeletons Demo Section */}
      <section className="glass-card rounded-3xl p-stack-lg border-white/5 text-white">
        <h4 className="font-label-md text-label-md font-bold mb-6 text-on-surface-variant">Asset Loading Preview</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
          <div className="space-y-3">
            <div className="skeleton h-12 w-12 rounded-xl"></div>
            <div className="skeleton h-6 w-3/4 rounded-md"></div>
            <div className="skeleton h-4 w-1/2 rounded-md"></div>
          </div>
          <div className="space-y-3">
            <div className="skeleton h-12 w-12 rounded-xl"></div>
            <div className="skeleton h-6 w-3/4 rounded-md"></div>
            <div className="skeleton h-4 w-1/2 rounded-md"></div>
          </div>
          <div className="space-y-3">
            <div className="skeleton h-12 w-12 rounded-xl"></div>
            <div className="skeleton h-6 w-3/4 rounded-md"></div>
            <div className="skeleton h-4 w-1/2 rounded-md"></div>
          </div>
        </div>
      </section>
    </div>
  );
};
