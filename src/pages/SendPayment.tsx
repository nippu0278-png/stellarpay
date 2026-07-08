import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { buildAndSubmitPayment } from '../services/stellar';

export const SendPayment: React.FC = () => {
  const { publicKey, isConnected, balance, connectWallet, signTx, refreshBalance, showToast } = useWallet();
  
  // Form state default prefilled to match mockup send_payment/code.html
  const [recipient, setRecipient] = useState('GD3F...A2B4');
  const [amount, setAmount] = useState('450.00');
  const [memo, setMemo] = useState('');

  // Status state
  const [isSending, setIsSending] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState(false);

  const availableBalance = isConnected && balance !== null ? parseFloat(balance) : 124.50;

  // Form Validation
  const validateForm = () => {
    if (!recipient.trim() || !amount.trim()) {
      return 'Please fill in all required fields.';
    }

    // Allow mock address GD3F...A2B4 for demo purposes when not connected
    if (!isConnected && recipient.trim() === 'GD3F...A2B4') {
      return `Insufficient Balance (Available: ${availableBalance.toFixed(2)} XLM)`;
    }

    // Stellar public address check (Starts with G, length 56, standard base32 characters)
    const stellarAddressRegex = /^G[A-D2-7][A-Z2-7]{54}$/;
    if (!stellarAddressRegex.test(recipient.trim())) {
      return 'Invalid Stellar address. Addresses must start with "G" and be 56 characters long.';
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return 'Amount must be a positive number greater than 0.';
    }

    if (amt > availableBalance) {
      return `Insufficient Balance (Available: ${availableBalance.toFixed(2)} XLM)`;
    }

    return null;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setTxHash(null);

    if (!isConnected) {
      // Prompt wallet connection instead of blocking
      connectWallet();
      return;
    }

    const error = validateForm();
    if (error) {
      setErrorMessage(error);
      showToast(error, 'error');
      return;
    }

    setIsSending(true);
    setTxStatus('Initializing payment...');
    showToast('Initiating transaction...', 'info');

    try {
      const hash = await buildAndSubmitPayment(
        publicKey!,
        recipient.trim(),
        amount.trim(),
        memo.trim(),
        signTx,
        setTxStatus
      );

      setTxHash(hash);
      showToast('Transaction Successful!', 'success');
      
      // Clear form
      setRecipient('');
      setAmount('');
      setMemo('');
      
      // Auto refresh balance after brief timeout to let ledger settle
      setTimeout(() => {
        refreshBalance();
      }, 3000);

    } catch (err: any) {
      console.error('Send payment failed:', err);
      const msg = err.message || 'Transaction submission failed.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsSending(false);
      setTxStatus('');
    }
  };

  const handleCopyHash = () => {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash);
    setCopyStatus(true);
    showToast('Hash Copied to Clipboard', 'success');
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const handleReset = () => {
    setRecipient('');
    setAmount('');
    setMemo('');
    setErrorMessage(null);
    setTxHash(null);
  };

  const currentErrorMessage = errorMessage || validateForm();

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full py-stack-md text-white animate-fade-in-up">
      <div className="w-full max-w-[540px]">
        {/* Title Header */}
        <div className="mb-stack-lg text-center lg:text-left">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 font-bold">Send Payment</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Transfer XLM instantly across the globe with institutional-grade security.
          </p>
        </div>

        {/* Glass Card Form */}
        <div className="glass-card rounded-[32px] p-8 inner-glow relative border-white/5">
          {isSending && (
            <div className="absolute inset-0 bg-white/90 dark:bg-[#12141a]/95 backdrop-blur-md z-50 rounded-[32px] flex flex-col items-center justify-center gap-4 text-center p-6 border border-gray-200 dark:border-gray-800">
              <div className="relative flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black dark:border-white"></div>
                <span className="material-symbols-outlined text-black dark:text-white absolute text-2xl animate-pulse">send</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Sending Payment</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 font-mono break-all max-w-xs">{txStatus}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="relative z-10 flex flex-col gap-6">
            {/* Recipient Stellar Address */}
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface ml-1 font-bold">Recipient Stellar Address</label>
              <div className="group relative rounded-2xl bg-[#0b0e14]/80 border border-white/10 flex items-center px-4 py-4 focus-within:border-primary transition-all">
                <span className="material-symbols-outlined text-on-surface-variant mr-3">account_balance_wallet</span>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="bg-transparent border-none focus:outline-none focus:ring-0 w-full font-body-md text-on-surface placeholder:text-on-surface-variant/40 outline-none"
                  placeholder="G... or user*domain.com"
                  disabled={isSending}
                  required
                />
                <span className="material-symbols-outlined text-primary cursor-pointer hover:scale-110 transition-transform">qr_code_scanner</span>
              </div>
            </div>

            {/* Amount & Memo Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Amount */}
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface ml-1 font-bold">Amount</label>
                <div className={`group rounded-2xl bg-[#0b0e14]/80 border flex items-center px-4 py-4 focus-within:border-primary transition-all ${
                  parseFloat(amount) > availableBalance ? 'border-error/40' : 'border-white/10'
                }`}>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent border-none focus:outline-none focus:ring-0 w-full font-headline-md text-headline-md text-on-surface placeholder:text-on-surface-variant/40 outline-none"
                    placeholder="0.00"
                    disabled={isSending}
                    required
                  />
                  <span className="font-label-md text-on-surface-variant font-bold">XLM</span>
                </div>
                {currentErrorMessage && currentErrorMessage.includes('Insufficient') && (
                  <p className="text-error font-label-sm text-label-sm mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {currentErrorMessage}
                  </p>
                )}
              </div>

              {/* Memo */}
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface ml-1 font-bold">Memo (Optional)</label>
                <div className="group rounded-2xl bg-[#0b0e14]/80 border border-white/10 flex items-center px-4 py-3 focus-within:border-primary transition-all h-full min-h-[72px]">
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="bg-transparent border-none focus:outline-none focus:ring-0 w-full font-body-md text-on-surface placeholder:text-on-surface-variant/40 resize-none h-full outline-none"
                    placeholder="Reference or message..."
                    maxLength={28}
                    disabled={isSending}
                  />
                </div>
              </div>
            </div>

            {/* Error Warning display (General non-insufficient errors) */}
            {currentErrorMessage && !currentErrorMessage.includes('Insufficient') && (
              <div className="bg-[#93000a]/20 border border-[#ffb4ab]/30 rounded-2xl p-4 flex gap-3 text-[#ffb4ab]">
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">error</span>
                <p className="text-xs font-body-md leading-relaxed">{currentErrorMessage}</p>
              </div>
            )}

            {/* Success Result Display */}
            {txHash && (
              <div className="bg-[#007184]/20 border border-[#4cd7f6]/30 rounded-2xl p-4 space-y-3 text-white">
                <div className="flex gap-3 text-[#4cd7f6]">
                  <span className="material-symbols-outlined text-[20px] flex-shrink-0">check_circle</span>
                  <div>
                    <p className="text-sm font-bold">Transaction Confirmed!</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Fund transfer was successfully submitted.</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Transaction Hash</span>
                  <div className="flex items-center justify-between gap-3 bg-[#0b0e14]/50 rounded-xl p-2.5 font-mono text-xs border border-white/5">
                    <span className="break-all select-all text-white/90">{txHash}</span>
                    <button
                      type="button"
                      onClick={handleCopyHash}
                      className="text-[#4cd7f6] hover:text-white p-1 transition-colors flex-shrink-0"
                      title="Copy Hash"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copyStatus ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Preview Area */}
            <div className="rounded-2xl bg-white/[0.03] p-5 border border-white/5">
              <h4 className="font-label-md text-label-md font-bold mb-3 uppercase tracking-wider text-on-surface-variant">Transaction Preview</h4>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-on-surface-variant">Network Fee</span>
                  <span className="font-label-md text-on-surface">0.00001 XLM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-on-surface-variant">Processing Speed</span>
                  <span className="status-pill px-3 py-1 rounded-full text-[11px] font-bold">~2.5s Instant</span>
                </div>
                <div className="h-[1px] bg-white/10 my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="font-label-md font-bold text-on-surface">Total Amount</span>
                  <span className="font-headline-md text-headline-md text-primary">
                    {amount && !isNaN(parseFloat(amount)) ? (parseFloat(amount) + 0.00001).toFixed(5) : '0.00001'} XLM
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-4">
              <button
                type="submit"
                disabled={isSending}
                className="primary-gradient w-full py-5 rounded-[20px] font-headline-md text-headline-md text-white shadow-xl shadow-primary-container/20 active:scale-95 transition-all hover:brightness-110 flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined">send</span>
                {isConnected ? 'Send XLM' : 'Connect Wallet to Send'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isSending}
                className="w-full py-4 rounded-[20px] bg-white/5 border border-white/10 font-label-md text-label-md text-on-surface-variant hover:bg-white/10 active:scale-98 transition-all"
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>

        {/* Footer Meta */}
        <div className="mt-8 flex justify-center gap-6 text-on-surface-variant/60 font-label-sm text-label-sm">
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">verified_user</span> End-to-End Encrypted</span>
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">speed</span> Fast Settlement</span>
        </div>
      </div>
    </div>
  );
};
