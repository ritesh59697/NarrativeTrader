'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const C = {
  primaryFixed:   '#ffe0ec',
  onPrimaryFixed: '#3d0020',
  primaryFixedDim:'#ff80aa',
  onSurface:      '#e8e0f0',
  onSurfaceVar:   '#a098b0',
  outlineVar:     '#302840',
  secondary:      '#00ffcc',
};

const IconQueryStats = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export function Navbar() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    setWalletAddress(localStorage.getItem('connected_wallet'));
    const handleStorage = () => {
      setWalletAddress(localStorage.getItem('connected_wallet'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const connectWallet = async () => {
    if (walletAddress) {
      localStorage.removeItem('connected_wallet');
      setWalletAddress(null);
      window.dispatchEvent(new Event('storage'));
    } else {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts[0]) {
            localStorage.setItem('connected_wallet', accounts[0]);
            setWalletAddress(accounts[0]);
            window.dispatchEvent(new Event('storage'));
            return;
          }
        } catch (err) {
          console.warn('Wallet connection request failed/rejected, using simulation address instead.', err);
        }
      }
      const mockAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
      localStorage.setItem('connected_wallet', mockAddress);
      setWalletAddress(mockAddress);
      window.dispatchEvent(new Event('storage'));
    }
  };

  return (
    <header
      style={{
        position:       'fixed',
        top: 0, left: 0, right: 0,
        height:         80,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 32px',
        zIndex:         100,
        background:     'rgba(19,19,20,0.4)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom:   `1px solid rgba(48,40,64,0.12)`,
      }}
    >
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Pink icon box */}
          <div style={{
            width: 32, height: 32,
            background:    C.primaryFixed,
            borderRadius:  4,
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            flexShrink:    0,
            color:         C.onPrimaryFixed,
          }}>
            <IconQueryStats />
          </div>
          <span style={{
            color:        C.onSurface,
            fontFamily:   "'Sora', sans-serif",
            fontWeight:   700,
            fontSize:     20,
            letterSpacing:'-0.02em',
            textTransform:'uppercase',
          }}>
            Narrative Trader
          </span>
        </Link>
      </div>

      {/* Right: Connect Wallet button */}
      <button
        onClick={connectWallet}
        style={{
          background:    C.primaryFixed,
          color:         C.onPrimaryFixed,
          fontFamily:    "'Space Grotesk', monospace",
          fontSize:      11,
          fontWeight:    700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          padding:       '10px 24px',
          borderRadius:  4,
          border:        'none',
          cursor:        'pointer',
          transition:    'background 0.15s',
          display:       'inline-flex',
          alignItems:    'center',
          gap:           8,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = C.primaryFixedDim)}
        onMouseLeave={e => (e.currentTarget.style.background = C.primaryFixed)}
      >
        {walletAddress ? (
          <>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.secondary }} />
            {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
          </>
        ) : (
          'Connect Wallet'
        )}
      </button>
    </header>
  );
}
