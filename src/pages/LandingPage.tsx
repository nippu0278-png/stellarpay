import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

export const LandingPage: React.FC = () => {
  const { isConnected, isConnecting, connectWallet } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard');
    }
  }, [isConnected, navigate]);

  return (
    <div className="bg-[#10131a] text-[#e1e2eb] font-body-md overflow-x-hidden selection:bg-[#d2bbff]/30 min-h-screen relative">
      {/* Header / TopNavBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-container-padding-mobile md:px-container-padding-desktop py-stack-md glass-nav border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* Logo SVG (Inlined for performance & vector clarity) */}
          <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                <linearGradient id="stellarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#0566d9', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="none" stroke="url(#stellarGrad)" strokeWidth="4" />
              <circle cx="50" cy="50" r="15" fill="url(#stellarGrad)" />
              <path d="M30 50 L45 50 M55 50 L70 50 M50 30 L50 45 M50 55 L50 70" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-headline-md text-headline-md font-bold text-white tracking-tight">StellarPay</span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a className="font-label-md text-label-md text-white border-b-2 border-[#d2bbff] pb-1" href="#home">Home</a>
          <a className="font-label-md text-label-md text-[#ccc3d8] hover:text-white transition-colors" href="#features">Rewards</a>
          <a className="font-label-md text-label-md text-[#ccc3d8] hover:text-white transition-colors" href="#explorer">Explorer</a>
          <a className="font-label-md text-label-md text-[#ccc3d8] hover:text-white transition-colors" href="#settings">Settings</a>
        </nav>

        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="hidden md:flex items-center gap-2 px-stack-md py-2 glass-card border-white/10 rounded-full text-label-md font-label-md hover:bg-white/10 transition-all active:scale-95 text-white"
        >
          <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </header>

      {/* Main Section */}
      <main className="relative pt-24 z-10">
        {/* Hero Section */}
        <section id="home" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-container-padding-mobile">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#10131a]/40 via-[#10131a]/20 to-[#10131a] z-10"></div>
            <img
              className="w-full h-full object-cover opacity-25"
              src="/background.png"
              alt="Background Flow"
            />
          </div>

          <div className="relative z-20 max-w-4xl text-center space-y-stack-lg animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-white/20 text-[#d2bbff] text-label-sm font-label-sm mb-stack-md">
              <span className="flex h-2 w-2 rounded-full bg-[#d2bbff] animate-pulse"></span>
              Stellar Testnet Powered
            </div>

            <h1 className="font-display text-[40px] md:text-display leading-tight text-white mb-stack-md">
              Fast Student Payments on <span className="text-gradient">Stellar</span>
            </h1>

            <p className="font-body-lg text-body-lg text-[#ccc3d8] max-w-2xl mx-auto leading-relaxed">
              The next generation of fintech designed for students. Send XLM instantly with zero stress and earn rewards through automated smart contracts.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-stack-md pt-stack-lg">
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="primary-button-gradient text-white px-8 py-4 rounded-xl font-headline-md text-label-md shadow-xl shadow-primary/20 hover:brightness-110 hover:-translate-y-0.5 transition-all w-full sm:w-auto active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
              <a
                href="#features"
                className="glass-card hover:bg-white/10 text-white px-8 py-4 rounded-xl font-headline-md text-label-md w-full sm:w-auto transition-all active:scale-95 flex items-center justify-center"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section id="features" className="px-container-padding-mobile md:px-container-padding-desktop py-24 bg-[#0b0e14] relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center mb-16 space-y-4">
              <h2 className="font-headline-lg text-headline-lg md:text-[40px] text-white">Engineered for the Modern Student</h2>
              <p className="text-[#ccc3d8] font-body-md max-w-xl">Reliability of institutional finance, speed of digital-native technology.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {/* Card 1 */}
              <div className="md:col-span-2 glass-card p-stack-lg rounded-2xl flex flex-col justify-between group hover:border-[#d2bbff]/50 transition-all duration-500 min-h-[320px]">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[32px]">shield</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-white font-bold">Secure Payments</h3>
                  <p className="text-on-surface-variant font-body-md leading-relaxed">
                    Multi-signature security protocols and cold storage options keep your student funds safe while you focus on what matters most.
                  </p>
                </div>
                <div className="mt-8 flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-surface-container-high text-label-sm font-label-sm text-on-surface-variant">Encrypted</span>
                  <span className="px-3 py-1 rounded-full bg-surface-container-high text-label-sm font-label-sm text-on-surface-variant">Verified</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="glass-card p-stack-lg rounded-2xl group hover:border-[#d2bbff]/50 transition-all duration-500 min-h-[280px]">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:rotate-12 transition-transform">
                    <span className="material-symbols-outlined text-[32px]">bolt</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-white font-bold">Instant Transfers</h3>
                  <p className="text-on-surface-variant font-body-md leading-relaxed">
                    Settlement in seconds, not days. Send assets globally for fractions of a cent.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="glass-card p-stack-lg rounded-2xl group hover:border-[#d2bbff]/50 transition-all duration-500 min-h-[280px]">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:-translate-y-1 transition-transform">
                    <span className="material-symbols-outlined text-[32px]">terminal</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-white font-bold">Stellar Powered</h3>
                  <p className="text-on-surface-variant font-body-md leading-relaxed">
                    Built on the industry-leading network for real-world asset tokenization.
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="md:col-span-2 glass-card p-stack-lg rounded-2xl flex items-center justify-between group hover:border-[#d2bbff]/50 transition-all duration-500 min-h-[200px]">
                <div className="space-y-4 max-w-lg">
                  <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-white font-bold">Smart Contract Rewards</h3>
                  <p className="text-on-surface-variant font-body-md leading-relaxed">
                    Earn yield automatically on your balances and cashback on everyday student purchases through Soroban-powered rewards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-container-padding-mobile border-t border-white/5 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center space-y-stack-lg">
            <h2 className="font-headline-lg text-headline-lg md:text-[40px] text-white">Ready to join the future?</h2>
            <p className="text-on-surface-variant font-body-md max-w-xl mx-auto">
              Connect your wallet today and experience the speed of Stellar network on the world's most advanced student wallet.
            </p>
            <div className="pt-stack-md">
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="primary-button-gradient text-white px-12 py-5 rounded-xl font-headline-md text-label-md shadow-2xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                {isConnecting ? 'Connecting...' : 'Connect Wallet Now'}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0b0e14] py-stack-lg border-t border-white/5 px-container-padding-mobile md:px-container-padding-desktop">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-gutter">
          <div className="flex items-center gap-3 opacity-80">
            {/* Logo SVG (Inlined vector logo) */}
            <div className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0 grayscale brightness-200">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="6" />
                <circle cx="50" cy="50" r="15" fill="white" />
                <path d="M30 50 L45 50 M55 50 L70 50 M50 30 L50 45 M50 55 L50 70" stroke="white" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-headline-md text-label-md font-bold text-white tracking-tight">StellarPay</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-[#ccc3d8] flex-wrap justify-center">
            <a className="hover:text-white transition-colors" href="#privacy">Privacy Policy</a>
            <a className="hover:text-white transition-colors" href="#terms">Terms of Service</a>
            <a className="hover:text-white transition-colors" href="#docs">Documentation</a>
          </div>

          <p className="text-xs text-[#ccc3d8]/50">© 2026 StellarPay. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
