import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { useWallet } from '../contexts/WalletContext';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey, isConnected, connectWallet, activeProviderId } = useWallet();

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('stellarpay_theme');
    return saved !== 'light';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('stellarpay_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stellarpay_theme', 'light');
    }
  }, [darkMode]);

  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getProviderIcon = (id: string | null) => {
    if (id === 'albedo') return 'language';
    if (id === 'secret_key') return 'vpn_key';
    return 'rocket_launch';
  };

  const getProviderName = (id: string | null) => {
    if (id === 'albedo') return 'Albedo';
    if (id === 'secret_key') return 'Dev Key';
    return 'Freighter';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0e14] text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Wrapper */}
      <div className="lg:ml-64 min-h-screen pb-24 lg:pb-0 relative z-10 flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 w-full px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-[#10131a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
          {/* Mobile/Desktop Branding */}
          <div className="flex items-center gap-4">
            <div className="lg:hidden w-8 h-8 rounded bg-black dark:bg-white flex items-center justify-center text-white dark:text-black mr-2">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <h2 className="font-semibold text-lg lg:hidden">StellarPay</h2>
            <h2 className="hidden lg:block font-bold text-xl text-black dark:text-white tracking-tight">Stellar Student Wallet</h2>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-4">
            {/* Wallet Quick Connector */}
            {isConnected && publicKey ? (
              <div className="hidden sm:flex items-center gap-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-full pl-3 pr-2 py-1">
                <span className="w-2 h-2 rounded-full bg-black dark:bg-white animate-pulse"></span>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{truncateAddress(publicKey)}</span>
                <span className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-350 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider font-mono">
                  {getProviderName(activeProviderId)}
                </span>
                <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center ml-1 text-white dark:text-black">
                  <span className="material-symbols-outlined text-[14px]">
                    {getProviderIcon(activeProviderId)}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-all text-xs font-bold"
              >
                <span className="material-symbols-outlined text-[14px]">link</span>
                Connect Wallet
              </button>
            )}

            {/* Dark Mode Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-150 dark:hover:bg-white/5 rounded-full text-gray-600 dark:text-gray-300 transition-all active:scale-95 flex items-center justify-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-transparent"
              title="Toggle Theme"
            >
              <span className="material-symbols-outlined text-[20px]">
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Notifications Button */}
            <button className="material-symbols-outlined p-2 hover:bg-gray-150 dark:hover:bg-white/5 rounded-full text-gray-600 dark:text-gray-350 transition-colors active:scale-95 border border-gray-200 dark:border-gray-800 bg-white dark:bg-transparent">
              notifications
            </button>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6 relative z-10">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
