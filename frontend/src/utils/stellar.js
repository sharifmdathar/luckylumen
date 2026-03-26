import * as StellarSdk from '@stellar/stellar-sdk';
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api';

export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';

export const CONTRACTS = {
  TOKEN: import.meta.env.VITE_TOKEN_CONTRACT_ID || '',
  ORACLE: import.meta.env.VITE_ORACLE_CONTRACT_ID || '',
  GAME: import.meta.env.VITE_GAME_CONTRACT_ID || '',
};

export async function connectWallet() {
  const connected = await isConnected();
  if (!connected) {
    throw new Error('Freighter wallet not found');
  }

  const publicKey = await getPublicKey();
  return publicKey;
}

export async function getTokenBalance(userAddress) {
  // Placeholder - implement actual balance check
  return 1000;
}

export async function playDice(userAddress, betAmount, prediction) {
  // Placeholder - implement actual contract call
  const mockRoll = Math.floor(Math.random() * 6) + 1;
  const won = mockRoll === prediction;

  return {
    actualRoll: mockRoll,
    won,
    payout: won ? betAmount * 5 : 0,
  };
}
