import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

export const Sidebar: React.FC = () => {
  const { publicKey, isConnected, isConnecting, connectWallet } = useWallet();
  const location = useLocation();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    const baseClass = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm";
    if (isActive) {
      return `${baseClass} bg-black dark:bg-white text-white dark:text-black font-bold shadow-sm`;
    }
    return `${baseClass} text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 hover:translate-x-1`;
  };

  const getIconStyle = (path: string) => {
    const isActive = location.pathname === path;
    return isActive ? { fontVariationSettings: "'FILL' 1" } : undefined;
  };

  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <aside className="hidden lg:flex flex-col p-6 gap-4 h-screen w-64 fixed left-0 top-0 bg-white dark:bg-[#10131a] border-r border-gray-200 dark:border-gray-800 z-40 transition-colors duration-200">
      {/* Branding */}
      <div className="flex items-center gap-3 mb-6 px-2 py-2">
        <div className="w-9 h-9 rounded bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_balance_wallet
          </span>
        </div>
        <div>
          <h1 className="font-bold text-lg text-black dark:text-white tracking-tight">StellarPay</h1>
          <p className="text-[11px] text-gray-400 font-mono">Testnet Connected</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex flex-col gap-1.5 flex-1">
        <Link className={getLinkClass('/dashboard')} to="/dashboard">
          <span className="material-symbols-outlined" style={getIconStyle('/dashboard')}>dashboard</span>
          <span className="font-semibold">Dashboard</span>
        </Link>
        
        <Link className={getLinkClass('/send')} to="/send">
          <span className="material-symbols-outlined" style={getIconStyle('/send')}>send</span>
          <span className="font-semibold">Send</span>
        </Link>

        <Link className={getLinkClass('/rewards')} to="/rewards">
          <span className="material-symbols-outlined" style={getIconStyle('/rewards')}>military_tech</span>
          <span className="font-semibold">Rewards</span>
        </Link>

        <Link className={getLinkClass('/events')} to="/events">
          <span className="material-symbols-outlined" style={getIconStyle('/events')}>event</span>
          <span className="font-semibold">Events</span>
        </Link>

        <Link className={getLinkClass('/explorer')} to="/explorer">
          <span className="material-symbols-outlined" style={getIconStyle('/explorer')}>explore</span>
          <span className="font-semibold">Explorer</span>
        </Link>

        <Link className={getLinkClass('/settings')} to="/settings">
          <span className="material-symbols-outlined" style={getIconStyle('/settings')}>settings</span>
          <span className="font-semibold">Settings</span>
        </Link>
      </nav>

      {/* Connect Wallet footer */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
        {isConnected && publicKey ? (
          <div className="border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-pulse"></span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase font-mono">Connected</span>
            </div>
            <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">{truncateAddress(publicKey)}</p>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-sm">link</span>
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </aside>
  );
};
