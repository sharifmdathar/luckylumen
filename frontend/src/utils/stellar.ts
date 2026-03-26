import * as StellarSdk from '@stellar/stellar-sdk';
import { getAddress, isConnected, requestAccess } from '@stellar/freighter-api';

export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';

export const CONTRACTS = {
  TOKEN: import.meta.env.VITE_TOKEN_CONTRACT_ID || '',
  ORACLE: import.meta.env.VITE_ORACLE_CONTRACT_ID || '',
  GAME: import.meta.env.VITE_GAME_CONTRACT_ID || '',
};

type HorizonBalance = {
  asset_type: string;
  balance: string;
};

type HorizonAccountResponse = {
  balances: HorizonBalance[];
};

type HorizonLedgersResponse = {
  _embedded?: {
    records?: Array<{
      sequence: string;
      hash?: string;
      closed_at?: string;
    }>;
  };
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function extractAddress(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as {
    address?: unknown;
    publicKey?: unknown;
    data?: { address?: unknown; publicKey?: unknown };
  };

  const fromTopLevel =
    (typeof candidate.address === 'string' && candidate.address) ||
    (typeof candidate.publicKey === 'string' && candidate.publicKey) ||
    null;
  if (fromTopLevel) {
    return fromTopLevel;
  }

  const fromData =
    (typeof candidate.data?.address === 'string' && candidate.data.address) ||
    (typeof candidate.data?.publicKey === 'string' && candidate.data.publicKey) ||
    null;
  return fromData;
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const maybe = payload as {
    error?: unknown;
    message?: unknown;
    data?: { error?: unknown; message?: unknown };
  };
  const value =
    maybe.error ??
    maybe.message ??
    maybe.data?.error ??
    maybe.data?.message;
  return typeof value === 'string' && value.trim() ? value : null;
}

export async function getConnectedWalletAddress(): Promise<string | null> {
  try {
    const { isConnected: connected } = await withTimeout(
      isConnected(),
      5000,
      'Freighter did not respond while checking connection.',
    );
    if (!connected) {
      return null;
    }

    const addressResponse = await withTimeout(
      getAddress(),
      5000,
      'Freighter did not respond while reading address.',
    );
    return extractAddress(addressResponse);
  } catch {
    return null;
  }
}

export async function connectWallet(): Promise<string> {
  const { isConnected: connected } = await withTimeout(
    isConnected(),
    8000,
    'Freighter did not respond while checking connection.',
  );
  if (!connected) {
    throw new Error('Freighter is not connected. Open the extension and allow this site.');
  }

  const accessResponse = await withTimeout(
    requestAccess(),
    12000,
    'Freighter did not respond. Open the extension popup and approve access.',
  );

  const address = extractAddress(accessResponse);
  if (!address) {
    const apiError = extractErrorMessage(accessResponse);
    throw new Error(apiError ?? 'Freighter returned an unexpected account response. Unlock Freighter and try again.');
  }
  return address;
}

export async function getTokenBalance(userAddress: string): Promise<number> {
  if (!userAddress) {
    return 0;
  }

  try {
    const response = await fetch(`${HORIZON_URL}/accounts/${userAddress}`);
    if (!response.ok) {
      return 0;
    }

    const account = (await response.json()) as HorizonAccountResponse;
    if (!account.balances?.length) {
      return 0;
    }

    const nonNative = account.balances.find((balance) => balance.asset_type !== 'native');
    const selected = nonNative ?? account.balances.find((balance) => balance.asset_type === 'native');
    const parsed = Number.parseFloat(selected?.balance ?? '0');
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  } catch {
    return 0;
  }
}

async function getLatestLedgerSeed(): Promise<string> {
  const response = await fetch(`${HORIZON_URL}/ledgers?order=desc&limit=1`);
  if (!response.ok) {
    return `${Date.now()}`;
  }

  const payload = (await response.json()) as HorizonLedgersResponse;
  const latest = payload._embedded?.records?.[0];
  if (!latest) {
    return `${Date.now()}`;
  }

  return `${latest.sequence}:${latest.hash ?? ''}:${latest.closed_at ?? ''}`;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function playDice(
  userAddress: string,
  betAmount: number,
  prediction: number,
): Promise<{ actualRoll: number; won: boolean; payout: number }> {
  if (!userAddress) {
    throw new Error('Wallet not connected');
  }
  if (!Number.isFinite(betAmount) || betAmount <= 0) {
    throw new Error('Invalid bet amount');
  }
  if (!Number.isInteger(prediction) || prediction < 1 || prediction > 6) {
    throw new Error('Prediction must be between 1 and 6');
  }

  const ledgerSeed = await getLatestLedgerSeed();
  const roundNonce = `${Date.now()}:${Math.random()}`;
  const digest = await sha256Hex(`${userAddress}:${betAmount}:${prediction}:${ledgerSeed}:${roundNonce}`);

  const byteValue = Number.parseInt(digest.slice(0, 2), 16);
  const actualRoll = (byteValue % 6) + 1;
  const won = actualRoll === prediction;

  return {
    actualRoll,
    won,
    payout: won ? betAmount * 5 : 0,
  };
}
