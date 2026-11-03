import {
  TransactionType,
  type DepositWalletCall,
  type RelayClient,
  type RelayerTransactionResponse,
  type SafeTransaction,
} from '@polymarket/builder-relayer-client';
import { type Address } from 'viem';

import { type PolymarketWalletDescriptor } from '@/features/polymarket/stores/polymarketWalletKindStore';
import { assertRelayerTransactionAccepted, waitForRelayerSettlement } from '@/features/polymarket/utils/relayResponse';

// This is a magic number from the Polymarket team. <= 600 causes problems with the relayer.
const DEPOSIT_WALLET_BATCH_DEADLINE_SECONDS = 900;

/**
 * An initialized Polymarket wallet bound to the relay client associated with it.
 */
export type PolymarketWallet = {
  address: Address;
  execute(transactions: SafeTransaction[], description: string): Promise<RelayerTransactionResponse>;
};

type PolymarketWalletImplementation = PolymarketWallet & {
  deploy(): Promise<RelayerTransactionResponse>;
  isDeployed(): Promise<boolean>;
};

type PolymarketWalletClient = Pick<RelayClient, 'deploy' | 'deployDepositWallet' | 'execute' | 'executeDepositWalletBatch' | 'getDeployed'>;

export async function createPolymarketWallet(
  descriptor: PolymarketWalletDescriptor,
  client: PolymarketWalletClient
): Promise<PolymarketWallet> {
  const wallet = descriptor.kind === 'depositWallet' ? createDepositWallet(descriptor, client) : createSafeWallet(descriptor, client);

  if (!(await wallet.isDeployed())) {
    await waitForRelayerSettlement(await wallet.deploy(), 'wallet deployment');
  }

  return {
    address: wallet.address,
    execute: async (transactions, description) => {
      const response = await wallet.execute(transactions, description);
      assertRelayerTransactionAccepted(response, description);
      return response;
    },
  };
}

function createSafeWallet({ address }: PolymarketWalletDescriptor, client: PolymarketWalletClient): PolymarketWalletImplementation {
  return {
    address,
    isDeployed: () => client.getDeployed(address),
    deploy: () => client.deploy(),
    execute: (transactions, description) => client.execute(transactions, description),
  };
}

function createDepositWallet({ address }: PolymarketWalletDescriptor, client: PolymarketWalletClient): PolymarketWalletImplementation {
  return {
    address,
    isDeployed: () => client.getDeployed(address, TransactionType.WALLET),
    deploy: () => client.deployDepositWallet(),
    execute: transactions => client.executeDepositWalletBatch(toDepositWalletCalls(transactions), address, getDepositWalletBatchDeadline()),
  };
}

function toDepositWalletCalls(transactions: SafeTransaction[]): DepositWalletCall[] {
  return transactions.map(({ data, to, value }) => ({ data, target: to, value }));
}

function getDepositWalletBatchDeadline(): string {
  return Math.floor(Date.now() / 1000 + DEPOSIT_WALLET_BATCH_DEADLINE_SECONDS).toString();
}
