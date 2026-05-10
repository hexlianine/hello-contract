import { publicClient, walletClient } from './client';
import { abi } from './abi';
import { getContract } from 'viem';

const contractAddress = `0x${process.env.APP_CONTRACT_ADDRESS}` as const;

const contract = getContract({
  address: contractAddress,
  abi: abi,
  client: {
    public: publicClient,
    wallet: walletClient,
  },
});

export const message = async () => {
  return await contract.read.message();
};

export const updateMessage = async () => {
  // Requires a wallet client for write operations
  throw new Error('Wallet client not configured');
};

console.log('Current message:');
console.log(await message());
console.log('End');
