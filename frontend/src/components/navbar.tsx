'use client';

import { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <header
        style={{
          position:       'fixed',
          top: 0, left: 0, right: 0,
          height:         isMobile ? 64 : 80,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        isMobile ? '0 16px' : '0 32px',
          zIndex:         100,
          background:     'rgba(19,19,20,0.6)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom:   `1px solid rgba(48,40,64,0.12)`,
        }}
      >
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 40 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
            {/* Pink icon box */}
            <div style={{
              width: isMobile ? 28 : 32, height: isMobile ? 28 : 32,
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
              fontSize:     isMobile ? 15 : 20,
              letterSpacing:'-0.02em',
              textTransform:'uppercase',
            }}>
              {isMobile ? 'Narrative' : 'Narrative Trader'}
            </span>
          </Link>

          {/* Center/Left: Navigation Links */}
          {!isMobile && (
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
          )}
        </div>

        {/* Right: RainbowKit Connect Button & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24 }}>
          <ConnectButton showBalance={false} />

          {isMobile && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: C.onSurface,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobile && isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10,10,18,0.96)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            padding: '32px 24px',
            gap: 24,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            style={{
              color: C.onSurface,
              fontFamily: "'Space Grotesk', monospace",
              fontSize: 18,
              fontWeight: 600,
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            Terminal
          </Link>
          <Link
            href="/docs"
            onClick={() => setIsOpen(false)}
            style={{
              color: C.onSurface,
              fontFamily: "'Space Grotesk', monospace",
              fontSize: 18,
              fontWeight: 600,
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            Docs
          </Link>
        </div>
      )}
    </>
  );
}
