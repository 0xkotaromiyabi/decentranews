import React from 'react';
import ReactDOM from 'react-dom/client';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, RainbowKitAuthenticationProvider } from '@rainbow-me/rainbowkit';
import App from './App';
import { config } from './wagmi';
import { authenticationAdapter } from './authAdapter';
import { API_URL } from './api';

// Suppress Lit dev mode warning
// @ts-ignore
window.litDisableBundleWarning = true;

const queryClient = new QueryClient();

function Root() {
  const [authStatus, setAuthStatus] = React.useState<AuthenticationStatus>('loading');

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_URL}/me`, { credentials: 'include' });
        if (res.ok) {
          setAuthStatus('authenticated');
        } else {
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        setAuthStatus('unauthenticated');
      }
    };
    checkAuth();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitAuthenticationProvider adapter={authenticationAdapter} status={authStatus}>
          <RainbowKitProvider>
            <App />
          </RainbowKitProvider>
        </RainbowKitAuthenticationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
