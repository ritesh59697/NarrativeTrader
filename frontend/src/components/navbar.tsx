'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const C = {
  primaryFixed:   '#ffe0ec',
  onPrimaryFixed: '#3d0020',
  primaryFixedDim:'#ff80aa',
  onSurface:      '#e8e0f0',
  onSurfaceVar:   '#a098b0',
  outlineVar:     '#302840',
};

const IconQueryStats = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export function Navbar() {
  const pathname  = usePathname();
  const isHome    = pathname === '/';
  const termHref  = isHome ? '#terminal' : '/#terminal';

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
      {/* Left: Logo + Nav */}
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

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {[
            { label: 'Ecosystem',     active: true  },
            { label: 'API',           active: false },
            { label: 'Institutional', active: false },
            { label: 'Governance',    active: false },
          ].map(({ label, active }) => (
            <a key={label} href="#" style={{
              color:         active ? C.onSurface : C.onSurfaceVar,
              fontFamily:    "'Space Grotesk', monospace",
              fontSize:      12,
              fontWeight:    700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              textDecoration:'none',
            }}>
              {label}
            </a>
          ))}
        </nav>
      </div>

      {/* Right: Connect Wallet button */}
      <a
        href={termHref}
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
          textDecoration:'none',
          transition:    'background 0.15s',
          display:       'inline-block',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = C.primaryFixedDim)}
        onMouseLeave={e => (e.currentTarget.style.background = C.primaryFixed)}
      >
        Connect Wallet
      </a>
    </header>
  );
}
