import {
  RelayerTransactionState,
  type RelayClient,
  type RelayerTransaction,
  type RelayerTransactionResponse,
  type SafeTransaction,
} from '@polymarket/builder-relayer-client';
import { type Address } from 'viem';

import { getPolymarketRelayClient } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { getPolymarketWallet, type PolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { RainbowError } from '@/logger';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { awaitPolygonConfirmation } from './confirmation';

export async function submitTradingWalletTransaction({
  transactions,
  description,
}: {
  transactions: SafeTransaction[];
  description: string;
}): Promise<RelayerTransactionResponse> {
  const owner = useWalletsStore.getState().accountAddress;
  if (!owner) throw new RainbowError('[polymarket] No active account address');

  const wallet = await getPolymarketWallet(owner);
  const client = await getPolymarketRelayClient();
  await ensureWalletDeployed(client, wallet);
  return await wallet.executeBatch({ client, transactions, description });
}

export async function ensureTradingWalletDeployed(): Promise<Address> {
  const owner = useWalletsStore.getState().accountAddress;
  if (!owner) throw new RainbowError('[polymarket] No active account address');

  const wallet = await getPolymarketWallet(owner);
  const client = await getPolymarketRelayClient();
  await ensureWalletDeployed(client, wallet);
  return wallet.address;
}

async function ensureWalletDeployed(client: RelayClient, wallet: PolymarketWallet): Promise<void> {
  const isDeployed = await wallet.isDeployed(client);
  if (isDeployed) return;

  const response = await wallet.deploy(client);
  await waitForRelayerTransaction(response, 'wallet deployment');
}

export async function waitForRelayerTransaction(response: RelayerTransactionResponse, description: string): Promise<RelayerTransaction> {
  assertRelayerTransactionAccepted(response, description);

  if (response.transactionHash) {
    await awaitPolygonConfirmation(response.transactionHash);
    const [transaction] = await response.getTransaction();
    if (!transaction) {
      throw new RainbowError(`[polymarket] ${description} confirmed but relayer returned no transaction`);
    }
    return transaction;
  }

  const transaction = await response.wait();
  if (!transaction) {
    throw new RainbowError(`[polymarket] ${description} did not confirm`);
  }

  if (transaction.state === RelayerTransactionState.STATE_FAILED) {
    throw new RainbowError(`[polymarket] ${description} failed`);
  }

  if (transaction.state === RelayerTransactionState.STATE_INVALID) {
    throw new RainbowError(`[polymarket] ${description} rejected as invalid`);
  }

  if (transaction.transactionHash) {
    await awaitPolygonConfirmation(transaction.transactionHash);
  }

  return transaction;
}

export async function executeRelayTransaction(transactions: SafeTransaction[], description: string): Promise<void> {
  const response = await submitTradingWalletTransaction({ transactions, description });
  await waitForRelayerTransaction(response, description);
}

function assertRelayerTransactionAccepted(response: RelayerTransactionResponse, description: string): void {
  if (response.state === RelayerTransactionState.STATE_FAILED) {
    throw new RainbowError(`[polymarket] ${description} failed`);
  }

  if (response.state === RelayerTransactionState.STATE_INVALID) {
    throw new RainbowError(`[polymarket] ${description} rejected as invalid`);
  }
}
