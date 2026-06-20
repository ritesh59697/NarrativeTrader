'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { bscTestnet, bsc } from 'wagmi/chains';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

// Project ID obtained from WalletConnect Cloud (or fallback dummy key)
const PROJECT_ID = '0463c220f8c37d45f949c25091a134a4';

const config = getDefaultConfig({
  appName: 'Narrative Trader Terminal',
  projectId: PROJECT_ID,
  chains: [bscTestnet, bsc],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#ff2d78',
            accentColorForeground: '#3d0020',
            borderRadius: 'medium',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
