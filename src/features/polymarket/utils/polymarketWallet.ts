import {
  deriveDepositWallet,
  RelayClient,
  TransactionType,
  type DepositWalletCall,
  type RelayerTransactionResponse,
  type SafeTransaction,
} from '@polymarket/builder-relayer-client';
import { SignatureTypeV2 } from '@polymarket/clob-client-v2';
import { type Address } from 'viem';

import {
  BUILDER_CONFIG,
  POLYMARKET_DEPOSIT_WALLET_FACTORY_ADDRESS,
  POLYMARKET_DEPOSIT_WALLET_IMPLEMENTATION_ADDRESS,
  POLYMARKET_RELAYER_PROXY_URL,
} from '@/features/polymarket/constants';
import { usePolymarketWalletStore, type PolymarketWalletKind } from '@/features/polymarket/stores/polymarketWalletStore';
import { deriveSafeWalletAddress } from '@/features/polymarket/utils/deriveSafeWalletAddress';
import { RainbowError } from '@/logger';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { ChainId } from '@rainbow-me/swaps';

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

  const cachedKind = usePolymarketWalletStore.getState().getWalletKind(address);
  if (cachedKind) return createPolymarketWallet(address, cachedKind);

  const resolvedKind = await resolveWalletKindFor(address);
  return createPolymarketWallet(address, resolvedKind);
}

export async function resolveWalletKindFor(owner: Address): Promise<PolymarketWalletKind> {
  const client = new RelayClient(POLYMARKET_RELAYER_PROXY_URL, ChainId.polygon, undefined, BUILDER_CONFIG);
  const safeIsDeployed = await client.getDeployed(deriveSafeWalletAddress(owner));
  const kind: PolymarketWalletKind = safeIsDeployed ? 'safe' : 'depositWallet';
  usePolymarketWalletStore.getState().setWalletKind(owner, kind);
  return kind;
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
      console.log('deploying deposit wallet', address);
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
