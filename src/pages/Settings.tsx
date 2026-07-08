import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';

export const Settings: React.FC = () => {
  const { publicKey, isConnected, disconnectWallet, connectWallet, showToast, activeProviderId, setSecretKey } = useWallet();
  const [copyStatus, setCopyStatus] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('stellarpay_theme') || 'dark';
  });

  const activeAddress = isConnected && publicKey ? publicKey : 'GBRE...U6T5';

  const handleCopy = () => {
    const copyTarget = isConnected && publicKey ? publicKey : 'GBREU6T5';
    navigator.clipboard.writeText(copyTarget);
    setCopyStatus(true);
    showToast('Address Copied to Clipboard', 'success');
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const toggleTheme = (theme: 'light' | 'dark') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('stellarpay_theme', 'dark');
      setThemeMode('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stellarpay_theme', 'light');
      setThemeMode('light');
    }
    showToast(`Theme switched to ${theme} mode`, 'success');
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    if (addr === 'GBRE...U6T5') return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Sync theme selection state if updated externally
  useEffect(() => {
    const checkTheme = () => {
      const activeTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      if (activeTheme !== themeMode) {
        setThemeMode(activeTheme);
      }
    };
    const interval = setInterval(checkTheme, 1000);
    return () => clearInterval(interval);
  }, [themeMode]);

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6 animate-fade-in-up pb-8 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Header Title */}
      <div className="hidden lg:block pt-6 pb-2">
        <h2 className="font-bold text-2xl text-black dark:text-white tracking-tight animate-fade-in-up">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your StellarPay profile, theme preferences, and wallet credentials.</p>
      </div>

      {/* Profile & Wallet */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_circle
          </span>
          <h3 className="font-bold text-lg">Profile &amp; Wallet</h3>
        </div>

        <div className="glass-card rounded-2xl p-6 shadow-sm border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-lg border border-gray-300 dark:border-gray-700 flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">person</span>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Connected Wallet</p>
                <p
                  onClick={handleCopy}
                  className="text-black dark:text-white font-mono text-sm mt-1 break-all cursor-pointer hover:underline flex items-center gap-1.5"
                  title="Click to copy address"
                >
                  <span>{truncateAddress(activeAddress)}</span>
                  <span className="material-symbols-outlined text-sm">
                    {copyStatus ? 'check' : 'content_copy'}
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-black dark:bg-white animate-pulse' : 'bg-gray-400'}`}></span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {isConnected ? 'Active on Stellar Network' : 'Disconnected (Demo Mode)'}
                  </span>
                </div>
              </div>
            </div>
            {isConnected ? (
              <button
                onClick={disconnectWallet}
                className="px-5 py-2.5 border border-black dark:border-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Disconnect
              </button>
            ) : (
              <button
                onClick={connectWallet}
                className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-sm">link</span>
                Connect Wallet
              </button>
            )}
          </div>

          {/* Developer Mode Secret Key Update */}
          {isConnected && activeProviderId === 'secret_key' && (
            <div className="mt-6 pt-6 border-t border-gray-250 dark:border-gray-800 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Developer Credentials</label>
                <p className="text-xs text-gray-400 mt-0.5">Input a new secret key to switch the local developer wallet identity.</p>
              </div>
              <div className="flex gap-2 items-center max-w-lg">
                <input
                  type="password"
                  placeholder="Enter Secret Key (starts with S...)"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  className="flex-1 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-mono focus:outline-none focus:border-black dark:focus:border-white text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => {
                    if (secretInput.trim()) {
                      try {
                        setSecretKey(secretInput.trim());
                        setSecretInput('');
                        showToast('Secret Key updated', 'success');
                      } catch (e: any) {
                        showToast(e.message || 'Key update failed', 'error');
                      }
                    }
                  }}
                  className="px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
                >
                  Save Key
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-bold">Network Mode</label>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Sandbox and smart contracts locked to Testnet environment</p>
              </div>
              <div className="relative">
                <select
                  className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 rounded-lg px-4 py-2 pr-8 cursor-not-allowed appearance-none text-xs font-mono"
                  disabled
                  defaultValue="testnet"
                >
                  <option value="testnet">Stellar Testnet</option>
                  <option value="mainnet">Stellar Mainnet</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            palette
          </span>
          <h3 className="font-bold text-lg">Appearance</h3>
        </div>

        <div className="glass-card rounded-2xl p-6 border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-bold">Interface Theme</label>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Switch between monochromatic dark mode and high-contrast light mode</p>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-250 dark:border-gray-800">
              <button
                type="button"
                onClick={() => toggleTheme('light')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-xs font-semibold ${
                  themeMode === 'light'
                    ? 'bg-white text-black shadow'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">light_mode</span>
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => toggleTheme('dark')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-xs font-semibold ${
                  themeMode === 'dark'
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  dark_mode
                </span>
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            info
          </span>
          <h3 className="font-bold text-lg">About</h3>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">App Version</span>
              <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-mono">
                v2.4.0-monochrome
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Smart Contract Engine</span>
              <span className="font-semibold text-xs">Soroban Wasm Engine</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Network Connector</span>
              <span className="font-semibold text-xs">Stellar Horizon &amp; RPC SDK</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col items-center text-center space-y-4">
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed max-w-lg">
                Developed for the Stellar community. Built using Stellar SDK and Soroban environments to provide a fast, secure, and clean payment experience for students.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 flex flex-col items-center text-center space-y-2 opacity-40">
        <div className="flex items-center gap-2 text-xs">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          <p>Secured by Stellar Consensus Protocol</p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em]">© 2026 StellarPay Technologies Inc.</p>
      </footer>
    </div>
  );
};
