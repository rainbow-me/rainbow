import { RelayClient } from '@polymarket/builder-relayer-client';
import { SignatureTypeV2 } from '@polymarket/clob-client-v2';
import { createQueryStore } from '@storesjs/stores';
import { createWalletClient, custom, getAddress, type Address } from 'viem';

import { POLYMARKET_RELAYER_PROXY_URL } from '@/features/polymarket/constants';
import { deriveSafeWalletAddress } from '@/features/polymarket/utils/deriveSafeWalletAddress';
import { getPolymarketRelayChain } from '@/features/polymarket/utils/polymarketRelayChain';
import { time } from '@/framework/core/utils/time';
import { RainbowError } from '@/logger';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { ChainId } from '@rainbow-me/swaps';

export type PolymarketWalletKind = 'safe' | 'depositWallet';

export type PolymarketWalletDescriptor = {
  address: Address;
  kind: PolymarketWalletKind;
  owner: Address;
  signatureType: SignatureTypeV2;
};

export type PolymarketWalletDescriptorClient = Pick<RelayClient, 'deriveDepositWalletAddress' | 'getDeployed'>;

type Params = { owner: Address };

export const usePolymarketWalletStore = createQueryStore<PolymarketWalletDescriptor, Params>(
  {
    fetcher: fetchPolymarketWalletKind,
    enabled: $ => $(useWalletsStore, s => !!s.accountAddress),
    params: { owner: $ => $(useWalletsStore, s => s.accountAddress) },
    cacheTime: time.weeks(1),
    staleTime: time.days(1),
  },
  { storageKey: 'polymarketWalletStore' }
);

export async function getPolymarketWalletDescriptor(owner: Address): Promise<PolymarketWalletDescriptor> {
  const store = usePolymarketWalletStore.getState();
  const descriptor = await store.fetch({ owner });
  if (!descriptor) throw new RainbowError('[Polymarket] Failed to resolve wallet');

  return descriptor;
}

export async function resolvePolymarketWalletDescriptor(
  owner: Address,
  client: PolymarketWalletDescriptorClient = createPolymarketWalletDescriptorClient(owner)
): Promise<PolymarketWalletDescriptor> {
  const safeAddress = deriveSafeWalletAddress(owner);
  const safeIsDeployed = await client.getDeployed(safeAddress);

  if (safeIsDeployed) {
    return {
      address: safeAddress,
      kind: 'safe',
      owner,
      signatureType: SignatureTypeV2.POLY_GNOSIS_SAFE,
    };
  }

  return {
    address: getAddress(await client.deriveDepositWalletAddress()),
    kind: 'depositWallet',
    owner,
    signatureType: SignatureTypeV2.POLY_1271,
  };
}

async function fetchPolymarketWalletKind({ owner }: Params): Promise<PolymarketWalletDescriptor> {
  if (!owner) throw new RainbowError('[PolymarketWalletStore] owner is required');
  return resolvePolymarketWalletDescriptor(owner);
}

function createPolymarketWalletDescriptorClient(owner: Address): RelayClient {
  const chain = getPolymarketRelayChain();
  const walletClient = createWalletClient({
    account: owner,
    chain,
    transport: custom({
      request: async () => {
        throw new RainbowError('[PolymarketWalletStore] Read-only wallet client cannot send RPC requests');
      },
    }),
  });

  return new RelayClient(POLYMARKET_RELAYER_PROXY_URL, ChainId.polygon, walletClient, undefined, undefined, { chain });
}
