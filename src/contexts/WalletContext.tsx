import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchXlmBalance } from '../services/stellar';
import type { WalletProvider as IWalletProvider } from '../wallet/types';
import { FreighterWalletProvider } from '../wallet/providers/freighter';
import { AlbedoWalletProvider } from '../wallet/providers/albedo';
import { SecretKeyWalletProvider } from '../wallet/providers/secret_key';
import { MnemonicWalletProvider } from '../wallet/providers/mnemonic';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | null;
  network: string | null;
  error: string | null;
  toasts: ToastMessage[];
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  showToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
  signTx: (xdr: string) => Promise<string>;
  activeProviderId: string | null;
  setSecretKey: (secret: string) => void;
  setMockPublicKey: (key: string) => void;
  setMnemonic: (phrase: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Instantiate static providers
const freighterProvider = new FreighterWalletProvider();
const albedoProvider = new AlbedoWalletProvider();
const secretKeyProvider = new SecretKeyWalletProvider();
const mnemonicProvider = new MnemonicWalletProvider();

class MockWalletProvider implements IWalletProvider {
  id = 'mock';
  name = 'Read-Only Address';
  logo = 'visibility';
  private pubKey: string | null = null;

  constructor() {
    this.pubKey = sessionStorage.getItem('stellarpay_mock_public_key');
  }

  setPublicKey(key: string) {
    this.pubKey = key;
    sessionStorage.setItem('stellarpay_mock_public_key', key);
  }

  async isInstalled(): Promise<boolean> {
    return true;
  }

  async connect(): Promise<string> {
    if (!this.pubKey) throw new Error('No public key entered.');
    return this.pubKey;
  }

  async disconnect(): Promise<void> {
    this.pubKey = null;
    sessionStorage.removeItem('stellarpay_mock_public_key');
  }

  async getNetwork(): Promise<string> {
    return 'TESTNET';
  }

  async signTransaction(): Promise<string> {
    throw new Error('Read-Only Address: Cannot sign transactions. Please connect using Freighter or Secret Key.');
  }
}

const mockProvider = new MockWalletProvider();

const PROVIDERS: Record<string, IWalletProvider> = {
  freighter: freighterProvider,
  albedo: albedoProvider,
  secret_key: secretKeyProvider,
  mnemonic: mnemonicProvider,
  mock: mockProvider,
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProviderId, setActiveProviderId] = useState<string | null>(() => {
    return localStorage.getItem('stellarpay_active_provider_id');
  });
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal UI state
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretInputText, setSecretInputText] = useState('');
  const [showMockInput, setShowMockInput] = useState(false);
  const [mockInputText, setMockInputText] = useState('');
  const [showMnemonicInput, setShowMnemonicInput] = useState(false);
  const [mnemonicInputText, setMnemonicInputText] = useState('');

  // Toast utilities
  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const xlmBalance = await fetchXlmBalance(publicKey);
      setBalance(xlmBalance);
      showToast('Balance Loaded', 'info');
    } catch (err: any) {
      console.error('Fetch balance error:', err);
      showToast(err.message || 'Failed to fetch balance', 'error');
    }
  }, [publicKey, showToast]);

  // Connect flow
  const selectProvider = async (providerId: string) => {
    setError(null);
    setShowSelectorModal(false);

    if (providerId === 'secret_key') {
      const storedSecret = sessionStorage.getItem('stellarpay_secret_key');
      if (!storedSecret) {
        setShowSecretInput(true);
        return;
      }
    }

    if (providerId === 'mock') {
      const storedKey = sessionStorage.getItem('stellarpay_mock_public_key');
      if (!storedKey) {
        setShowMockInput(true);
        return;
      }
    }

    if (providerId === 'mnemonic') {
      const storedMnemonic = sessionStorage.getItem('stellarpay_mnemonic');
      if (!storedMnemonic) {
        setShowMnemonicInput(true);
        return;
      }
    }

    await connectWithProvider(providerId);
  };

  const connectWithProvider = async (providerId: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      const provider = PROVIDERS[providerId];
      if (!provider) throw new Error('Unknown wallet provider.');

      const installed = await provider.isInstalled();
      if (!installed) {
        throw new Error(`${provider.name} is not installed or available.`);
      }

      const key = await provider.connect();
      setPublicKey(key);
      setActiveProviderId(providerId);
      setIsConnected(true);
      localStorage.setItem('stellarpay_active_provider_id', providerId);

      const net = await provider.getNetwork();
      setNetwork(net || 'TESTNET');

      try {
        const xlmBalance = await fetchXlmBalance(key);
        setBalance(xlmBalance);
      } catch (balErr) {
        setBalance('0.0000000');
        console.warn('Account not funded or fetch balance failed:', balErr);
      }

      showToast(`Connected via ${provider.name}`, 'success');
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setError(err.message || 'Connection failed');
      showToast(err.message || 'Connection failed', 'error');
      setIsConnected(false);
      setPublicKey(null);
      setActiveProviderId(null);
      localStorage.removeItem('stellarpay_active_provider_id');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWallet = useCallback(async () => {
    setShowSelectorModal(true);
  }, []);

  const disconnectWallet = useCallback(async () => {
    if (activeProviderId) {
      const provider = PROVIDERS[activeProviderId];
      if (provider) {
        await provider.disconnect();
      }
    }
    setPublicKey(null);
    setIsConnected(false);
    setBalance(null);
    setNetwork(null);
    setError(null);
    setActiveProviderId(null);
    localStorage.removeItem('stellarpay_active_provider_id');
    showToast('Wallet Disconnected', 'info');
  }, [activeProviderId, showToast]);

  const setSecretKey = useCallback((secret: string) => {
    try {
      secretKeyProvider.setSecret(secret);
      setShowSecretInput(false);
      connectWithProvider('secret_key');
    } catch (e: any) {
      showToast(e.message || 'Invalid Secret Key', 'error');
    }
  }, [showToast]);

  const setMockPublicKey = useCallback((pubKey: string) => {
    try {
      mockProvider.setPublicKey(pubKey);
      setShowMockInput(false);
      connectWithProvider('mock');
    } catch (e: any) {
      showToast(e.message || 'Invalid Public Key', 'error');
    }
  }, [showToast]);

  const setMnemonic = useCallback((phrase: string) => {
    try {
      mnemonicProvider.setMnemonic(phrase);
      setShowMnemonicInput(false);
      connectWithProvider('mnemonic');
    } catch (e: any) {
      showToast(e.message || 'Invalid Recovery Phrase', 'error');
    }
  }, [showToast]);

  const signTx = useCallback(async (xdr: string): Promise<string> => {
    if (!activeProviderId) {
      showToast('No active wallet connected', 'error');
      throw new Error('No active wallet provider connected.');
    }
    const provider = PROVIDERS[activeProviderId];
    try {
      showToast(`Signing transaction with ${provider.name}...`, 'info');
      const signedXdr = await provider.signTransaction(xdr, {
        networkPassphrase: 'Test SDF Network ; September 2015',
      });
      return signedXdr;
    } catch (err: any) {
      showToast('Transaction signing rejected or failed', 'error');
      throw new Error(err.message || 'Transaction signing failed.');
    }
  }, [activeProviderId, showToast]);

  // Handle account switcher monitoring (mainly Freighter)
  useEffect(() => {
    if (activeProviderId !== 'freighter' || !publicKey) return;

    const checkAccount = async () => {
      try {
        const provider = PROVIDERS['freighter'];
        const key = await provider.connect();
        if (key && key !== publicKey) {
          setPublicKey(key);
          const xlmBalance = await fetchXlmBalance(key);
          setBalance(xlmBalance);
          showToast('Account Switched', 'info');
        }
      } catch (e) {
        // ignore background errors
      }
    };

    const interval = setInterval(checkAccount, 3000);
    return () => clearInterval(interval);
  }, [activeProviderId, publicKey, showToast]);

  // Attempt auto-reconnect on mount
  useEffect(() => {
    if (activeProviderId) {
      if (activeProviderId === 'secret_key') {
        const storedSecret = sessionStorage.getItem('stellarpay_secret_key');
        if (storedSecret) {
          connectWithProvider('secret_key');
        } else {
          setActiveProviderId(null);
          localStorage.removeItem('stellarpay_active_provider_id');
        }
      } else if (activeProviderId === 'mock') {
        const storedKey = sessionStorage.getItem('stellarpay_mock_public_key');
        if (storedKey) {
          connectWithProvider('mock');
        } else {
          setActiveProviderId(null);
          localStorage.removeItem('stellarpay_active_provider_id');
        }
      } else if (activeProviderId === 'mnemonic') {
        const storedMnemonic = sessionStorage.getItem('stellarpay_mnemonic');
        if (storedMnemonic) {
          connectWithProvider('mnemonic');
        } else {
          setActiveProviderId(null);
          localStorage.removeItem('stellarpay_active_provider_id');
        }
      } else {
        connectWithProvider(activeProviderId);
      }
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        isConnected,
        isConnecting,
        balance,
        network,
        error,
        toasts,
        connectWallet,
        disconnectWallet,
        refreshBalance,
        showToast,
        removeToast,
        signTx,
        activeProviderId,
        setSecretKey,
        setMockPublicKey,
        setMnemonic,
      }}
    >
      {children}

      {/* Wallet Selector Modal (Grayscale Style) */}
      {showSelectorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#12141a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-xl text-gray-900 dark:text-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight">Select Wallet</h3>
              <button
                onClick={() => setShowSelectorModal(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => selectProvider('freighter')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">rocket_launch</span>
                  <span className="font-medium text-sm">Freighter Wallet</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">Extension</span>
              </button>

              <button
                onClick={() => selectProvider('albedo')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">language</span>
                  <span className="font-medium text-sm">Albedo Link</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">Browser</span>
              </button>

              <button
                onClick={() => selectProvider('mnemonic')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">password</span>
                  <span className="font-medium text-sm">Recovery Phrase</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">BIP-39</span>
              </button>

              <button
                onClick={() => selectProvider('secret_key')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">vpn_key</span>
                  <span className="font-medium text-sm">Secret Key</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">Developer</span>
              </button>

              <button
                onClick={() => selectProvider('mock')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">visibility</span>
                  <span className="font-medium text-sm">Read-Only Address</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">Demo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secret Key Input Modal (Grayscale Style) */}
      {showSecretInput && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#12141a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-xl text-gray-900 dark:text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold tracking-tight">Enter Secret Key</h3>
              <button
                onClick={() => setShowSecretInput(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Input your Stellar Secret Key (starts with 'S') to sign transactions locally. Your key is stored only in session memory.
            </p>
            <input
              type="password"
              placeholder="S..."
              value={secretInputText}
              onChange={(e) => setSecretInputText(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white mb-4 placeholder:text-gray-400 font-mono"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSecretInput(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-250 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSecretKey(secretInputText.trim());
                  setSecretInputText('');
                }}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg text-xs font-bold transition-all"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Public Key Input Modal (Grayscale Style) */}
      {showMockInput && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#12141a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-xl text-gray-900 dark:text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold tracking-tight">Enter Public Address</h3>
              <button
                onClick={() => setShowMockInput(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Input any Stellar public key address (starts with 'G') to connect in read-only / view-only mode.
            </p>
            <input
              type="text"
              placeholder="G..."
              value={mockInputText}
              onChange={(e) => setMockInputText(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white mb-4 placeholder:text-gray-400 font-mono"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowMockInput(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-250 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setMockPublicKey(mockInputText.trim());
                  setMockInputText('');
                }}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg text-xs font-bold transition-all"
              >
                Connect Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Phrase Input Modal (Grayscale Style) */}
      {showMnemonicInput && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#12141a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-xl text-gray-900 dark:text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold tracking-tight">Enter Recovery Phrase</h3>
              <button
                onClick={() => setShowMnemonicInput(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Input your 12-word recovery mnemonic seed phrase to derive your Stellar address and sign transactions locally. The phrase is stored only in session memory.
            </p>
            <textarea
              placeholder="renew cradle buyer..."
              rows={3}
              value={mnemonicInputText}
              onChange={(e) => setMnemonicInputText(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white mb-4 placeholder:text-gray-400 font-mono resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowMnemonicInput(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-250 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setMnemonic(mnemonicInputText.trim());
                  setMnemonicInputText('');
                }}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg text-xs font-bold transition-all"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
