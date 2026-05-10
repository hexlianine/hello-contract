import { createPublicClient, createWalletClient, webSocket } from 'viem';
import { sepolia } from 'viem/chains';

const API_URL = process.env.APP_API_URL;

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: webSocket(`${API_URL}`),
});

export const walletClient = createWalletClient({
  chain: sepolia,
  transport: webSocket(`${API_URL}`),
});


