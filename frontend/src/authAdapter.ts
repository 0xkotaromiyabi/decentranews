import { createAuthenticationAdapter } from '@rainbow-me/rainbowkit';
import { createSiweMessage } from 'viem/siwe';

import { API_URL } from './api';

export const authenticationAdapter = createAuthenticationAdapter({
    getNonce: async () => {
        const response = await fetch(`${API_URL}/nonce`, { credentials: 'include' });
        return await response.text();
    },
    createMessage: ({ nonce, address, chainId }) => {
        return createSiweMessage({
            domain: window.location.host,
            address,
            statement: 'Sign in with Ethereum to the app.',
            uri: window.location.origin,
            version: '1',
            chainId,
            nonce,
        });
    },
    verify: async ({ message, signature }) => {
        const verifyRes = await fetch(`${API_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, signature }),
            credentials: 'include',
        });
        return Boolean(verifyRes.ok);
    },
    signOut: async () => {
        // Optional: Call logout endpoint
        // await fetch(`${API_URL}/logout`, { credentials: 'include' });
    },
});
