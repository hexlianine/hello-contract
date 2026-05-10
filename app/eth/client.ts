import { createPublicClient, createWalletClient, Transport, webSocket } from 'viem';
import * as chains from 'viem/chains';

const API_URL = process.env.APP_API_URL;

const transport = webSocket(`${API_URL}`);

export const publicClient = generate(chains.sepolia.id, false, transport);
export const walletClient = generate(chains.sepolia.id, true, transport);

function generate(chainId: number, wallet: boolean, transport: Transport) {
  const chain = Object.values(chains).find((c) => c.id === chainId);

  if (!chain) {
    throw new Error(`Chain ${chainId} not found`);
  }

  return wallet
    ? createWalletClient({
        chain,
        transport: transport,
      })
    : createPublicClient({
        chain,
        transport: transport,
      });
}
