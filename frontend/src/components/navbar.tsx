'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

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

        {/* Center/Left: Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 24, marginLeft: 20 }}>
          <Link href="/dashboard" style={{
            color: C.onSurfaceVar,
            fontFamily: "'Space Grotesk', monospace",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = C.secondary}
          onMouseLeave={(e) => e.currentTarget.style.color = C.onSurfaceVar}>
            Terminal
          </Link>
          <Link href="/docs" style={{
            color: C.onSurfaceVar,
            fontFamily: "'Space Grotesk', monospace",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = C.secondary}
          onMouseLeave={(e) => e.currentTarget.style.color = C.onSurfaceVar}>
            Docs
          </Link>
        </nav>
      </div>

      {/* Right: RainbowKit Connect Button */}
      <ConnectButton showBalance={false} />
    </header>
  );
}
