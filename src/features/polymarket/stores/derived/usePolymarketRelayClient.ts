import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { RelayClient } from '@polymarket/builder-relayer-client';
import { ChainId } from '@rainbow-me/swaps';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { usePolymarketProxyAddress } from '@/features/polymarket/stores/derived/usePolymarketProxyAddress';
import { POLYMARKET_RELAYER_PROXY_URL, BUILDER_CONFIG } from '@/features/polymarket/constants';
import { loadViemWallet } from '@/features/polymarket/utils/loadViemWallet';
import { Address } from 'viem';

export const usePolymarketRelayClient = createDerivedStore(
  $ => {
    const address = $(useWalletsStore).accountAddress;
    const proxyAddress = $(usePolymarketProxyAddress).proxyAddress;

    return {
      address,
      proxyAddress,
      client: createClient(address),
    };
  },
  { fastMode: true }
);

async function createClient(address: Address): Promise<RelayClient | undefined> {
  const wallet = await loadViemWallet(address, getProvider({ chainId: ChainId.polygon }));
  if (!wallet) {
    logger.error(new RainbowError('[PolymarketRelayClient] Failed to load wallet for signing'));
    return undefined;
  }
  // @ts-expect-error - TODO: Fix
  return new RelayClient(POLYMARKET_RELAYER_PROXY_URL, ChainId.polygon, wallet, BUILDER_CONFIG);
}

export async function getPolymarketRelayClient(): Promise<RelayClient> {
  const client = await usePolymarketRelayClient.getState().client;
  if (!client) throw new RainbowError('[Polymarket] Failed to get relay client');
  return client;
}
