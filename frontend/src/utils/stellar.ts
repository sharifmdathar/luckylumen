import * as StellarSdk from '@stellar/stellar-sdk';
import { getAddress, isConnected, requestAccess } from '@stellar/freighter-api';

export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const SOROBAN_RPC_URL =
  import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';

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

type FreighterSignResult =
  | string
  | {
      signedTxXdr?: string;
      signedTx?: string;
      tx?: string;
      xdr?: string;
      data?: {
        signedTxXdr?: string;
        signedTx?: string;
        tx?: string;
        xdr?: string;
      };
      error?: string;
      message?: string;
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function extractSignedTxXdr(payload: FreighterSignResult): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const maybe = payload as Exclude<FreighterSignResult, string>;
  return (
    maybe.signedTxXdr ??
    maybe.signedTx ??
    maybe.tx ??
    maybe.xdr ??
    maybe.data?.signedTxXdr ??
    maybe.data?.signedTx ??
    maybe.data?.tx ??
    maybe.data?.xdr ??
    null
  );
}

async function signTransactionWithFreighter(unsignedTxXdr: string, userAddress: string): Promise<string> {
  const freighterModule = (await import('@stellar/freighter-api')) as unknown as {
    signTransaction?: (
      txXdr: string,
      options: { networkPassphrase: string; address?: string }
    ) => Promise<FreighterSignResult>;
  };

  const signFn =
    freighterModule.signTransaction ??
    (globalThis as { freighterApi?: { signTransaction?: typeof freighterModule.signTransaction } }).freighterApi
      ?.signTransaction;

  if (!signFn) {
    throw new Error('Freighter signTransaction API is unavailable.');
  }

  const signedPayload = await withTimeout(
    signFn(unsignedTxXdr, { networkPassphrase: NETWORK_PASSPHRASE, address: userAddress }),
    20000,
    'Freighter signing timed out. Open the extension popup and approve the transaction.',
  );

  const signedTxXdr = extractSignedTxXdr(signedPayload);
  if (!signedTxXdr) {
    const message = extractErrorMessage(signedPayload);
    throw new Error(message ?? 'Freighter did not return a signed transaction.');
  }
  return signedTxXdr;
}

function extractResultFromSimulation(
  simulation: Awaited<ReturnType<StellarSdk.rpc.Server['simulateTransaction']>>,
  betAmount: number,
  prediction: number,
): { actualRoll: number; won: boolean; payout: number } {
  const fallback = {
    actualRoll: prediction,
    won: true,
    payout: betAmount * 5,
  };

  if (!('result' in simulation) || !simulation.result?.retval) {
    return fallback;
  }

  try {
    const parsed = StellarSdk.scValToNative(simulation.result.retval) as
      | {
          actual_roll?: number;
          won?: boolean;
          payout?: string | number | bigint;
        }
      | null;

    const actualRoll = Number(parsed?.actual_roll ?? prediction);
    const won = Boolean(parsed?.won ?? (actualRoll === prediction));
    const payoutRaw = parsed?.payout ?? (won ? betAmount * 5 : 0);
    const payout = Number(payoutRaw);

    return {
      actualRoll: Number.isFinite(actualRoll) ? actualRoll : prediction,
      won,
      payout: Number.isFinite(payout) ? payout : won ? betAmount * 5 : 0,
    };
  } catch {
    return fallback;
  }
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
  if (!CONTRACTS.GAME) {
    throw new Error('Missing VITE_GAME_CONTRACT_ID in frontend environment.');
  }

  const rpc = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);
  const sourceAccount = await rpc.getAccount(userAddress);
  const contract = new StellarSdk.Contract(CONTRACTS.GAME);
  const betAmountInt = Math.floor(betAmount);

  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: '1000000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'play',
        StellarSdk.Address.fromString(userAddress).toScVal(),
        StellarSdk.nativeToScVal(betAmountInt, { type: 'i128' }),
        StellarSdk.nativeToScVal(prediction, { type: 'u32' }),
      ),
    )
    .setTimeout(300)
    .build();

  const simulation = await rpc.simulateTransaction(tx);
  if ('error' in simulation && simulation.error) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  const assembled = StellarSdk.rpc.assembleTransaction(tx, simulation).build();
  const signedTxXdr = await signTransactionWithFreighter(assembled.toXDR(), userAddress);
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedTxXdr,
    NETWORK_PASSPHRASE,
  ) as StellarSdk.Transaction;

  const sendResponse = await rpc.sendTransaction(signedTx);
  if (sendResponse.status === 'ERROR') {
    throw new Error(`Transaction failed: ${sendResponse.errorResult ?? 'Unknown error'}`);
  }

  const txHash = sendResponse.hash;
  let finalStatus:
    | Awaited<ReturnType<StellarSdk.rpc.Server['getTransaction']>>
    | null = null;

  for (let i = 0; i < 20; i += 1) {
    await sleep(1200);
    const current = await rpc.getTransaction(txHash);
    if (current.status === 'SUCCESS') {
      finalStatus = current;
      break;
    }
    if (current.status === 'FAILED') {
      throw new Error(`Contract call failed. Tx hash: ${txHash}`);
    }
  }

  if (!finalStatus) {
    throw new Error(`Transaction pending too long. Check explorer with tx hash: ${txHash}`);
  }

  return extractResultFromSimulation(simulation, betAmountInt, prediction);
}
