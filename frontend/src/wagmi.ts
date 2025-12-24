import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'DecentraNews',
    projectId: 'YOUR_PROJECT_ID', // Request one from WalletConnect if needed
    chains: [mainnet, sepolia],
    ssr: false,
});
