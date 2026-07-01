import {
  TransactionType,
  type DepositWalletCall,
  type RelayClient,
  type RelayerTransactionResponse,
  type SafeTransaction,
} from '@polymarket/builder-relayer-client';
import { SignatureTypeV2 } from '@polymarket/clob-client-v2';
import { type Address } from 'viem';

import { getPolymarketWalletDescriptor, type PolymarketWalletDescriptor } from '@/features/polymarket/stores/polymarketWalletKindStore';

// This is a magic number from the Polymarket team. <= 600 causes problems with the relayer.
const DEPOSIT_WALLET_BATCH_DEADLINE_SECONDS = 900;

export type PolymarketWallet = {
  address: Address;
  signatureType: SignatureTypeV2;
  isDeployed(client: RelayClient): Promise<boolean>;
  deploy(client: RelayClient): Promise<RelayerTransactionResponse>;
  executeBatch(args: { client: RelayClient; transactions: SafeTransaction[]; description: string }): Promise<RelayerTransactionResponse>;
};

export function createPolymarketWallet(descriptor: PolymarketWalletDescriptor): PolymarketWallet {
  return descriptor.kind === 'depositWallet' ? createDepositWallet(descriptor) : createSafeWallet(descriptor);
}

export async function getPolymarketWallet(owner: Address): Promise<PolymarketWallet> {
  return createPolymarketWallet(await getPolymarketWalletDescriptor(owner));
}

function createSafeWallet({ address }: PolymarketWalletDescriptor): PolymarketWallet {
  return {
    address,
    signatureType: SignatureTypeV2.POLY_GNOSIS_SAFE,
    isDeployed: client => client.getDeployed(address),
    deploy: client => client.deploy(),
    executeBatch: ({ client, transactions, description }) => client.execute(transactions, description),
  };
}

function createDepositWallet({ address }: PolymarketWalletDescriptor): PolymarketWallet {
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
