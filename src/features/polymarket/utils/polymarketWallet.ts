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

type PolymarketWalletClient = Pick<RelayClient, 'deploy' | 'deployDepositWallet' | 'execute' | 'executeDepositWalletBatch' | 'getDeployed'>;

export async function createPolymarketWallet(
  { address, kind }: PolymarketWalletDescriptor,
  client: PolymarketWalletClient
): Promise<PolymarketWallet> {
  const isDepositWallet = kind === 'depositWallet';
  const deployed = await client.getDeployed(address, isDepositWallet ? TransactionType.WALLET : undefined);

  if (!deployed) {
    const deployment = isDepositWallet ? await client.deployDepositWallet() : await client.deploy();
    await waitForRelayerSettlement(deployment, 'wallet deployment');
  }

  return {
    address,
    execute: async (transactions, description) => {
      const response = isDepositWallet
        ? await client.executeDepositWalletBatch(toDepositWalletCalls(transactions), address, getDepositWalletBatchDeadline())
        : await client.execute(transactions, description);

      assertRelayerTransactionAccepted(response, description);
      return response;
    },
  };
}

function toDepositWalletCalls(transactions: SafeTransaction[]): DepositWalletCall[] {
  return transactions.map(({ data, to, value }) => ({ data, target: to, value }));
}

function getDepositWalletBatchDeadline(): string {
  return Math.floor(Date.now() / 1000 + DEPOSIT_WALLET_BATCH_DEADLINE_SECONDS).toString();
}
