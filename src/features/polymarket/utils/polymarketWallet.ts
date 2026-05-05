import {
  deriveDepositWallet,
  TransactionType,
  type DepositWalletCall,
  type RelayClient,
  type RelayerTransactionResponse,
  type SafeTransaction,
} from '@polymarket/builder-relayer-client';
import { SignatureTypeV2 } from '@polymarket/clob-client-v2';
import { type Address } from 'viem';

import {
  POLYMARKET_DEPOSIT_WALLET_FACTORY_ADDRESS,
  POLYMARKET_DEPOSIT_WALLET_IMPLEMENTATION_ADDRESS,
} from '@/features/polymarket/constants';
import { usePolymarketWalletKindStore, type PolymarketWalletKind } from '@/features/polymarket/stores/polymarketWalletKindStore';
import { deriveSafeWalletAddress } from '@/features/polymarket/utils/deriveSafeWalletAddress';
import { RainbowError } from '@/logger';
import { useWalletsStore } from '@/state/wallets/walletsStore';

const DEPOSIT_WALLET_BATCH_DEADLINE_SECONDS = 240;

export type PolymarketWallet = {
  address: Address;
  signatureType: SignatureTypeV2;
  isDeployed(client: RelayClient): Promise<boolean>;
  deploy(client: RelayClient): Promise<RelayerTransactionResponse>;
  executeBatch(args: { client: RelayClient; transactions: SafeTransaction[]; description: string }): Promise<RelayerTransactionResponse>;
};

export function createPolymarketWallet(owner: Address, kind: PolymarketWalletKind): PolymarketWallet {
  return kind === 'depositWallet' ? createDepositWallet(owner) : createSafeWallet(owner);
}

export async function getPolymarketWallet(): Promise<PolymarketWallet> {
  const address = useWalletsStore.getState().accountAddress;
  if (!address) throw new RainbowError('[Polymarket] No active account address');

  const kind = usePolymarketWalletKindStore.getState().getData() ?? (await usePolymarketWalletKindStore.getState().fetch());
  if (!kind) throw new RainbowError('[Polymarket] Failed to resolve wallet kind');

  return createPolymarketWallet(address, kind);
}

function createSafeWallet(owner: Address): PolymarketWallet {
  const address = deriveSafeWalletAddress(owner);
  return {
    address,
    signatureType: SignatureTypeV2.POLY_GNOSIS_SAFE,
    isDeployed: client => client.getDeployed(address),
    deploy: client => client.deploy(),
    executeBatch: ({ client, transactions, description }) => client.execute(transactions, description),
  };
}

function createDepositWallet(owner: Address): PolymarketWallet {
  const address = deriveDepositWallet(
    owner,
    POLYMARKET_DEPOSIT_WALLET_FACTORY_ADDRESS,
    POLYMARKET_DEPOSIT_WALLET_IMPLEMENTATION_ADDRESS
  ) as Address;

  return {
    address,
    signatureType: SignatureTypeV2.POLY_1271,
    isDeployed: client => client.getDeployed(address, TransactionType.WALLET),
    deploy: client => {
      return client.deployDepositWallet();
    },
    executeBatch: ({ client, transactions }) =>
      client.executeDepositWalletBatch(toDepositWalletCalls(transactions), address, getDepositWalletBatchDeadline()),
  };
}

function toDepositWalletCalls(transactions: SafeTransaction[]): DepositWalletCall[] {
  return transactions.map(({ data, to, value }) => ({ data, target: to, value }));
}

function getDepositWalletBatchDeadline(): string {
  return Math.floor(Date.now() / 1000 + DEPOSIT_WALLET_BATCH_DEADLINE_SECONDS).toString();
}
