import { createDerivedStore } from '@storesjs/stores';

import { useWalletsStore } from '@/state/wallets/walletsStore';

import { HyperliquidAccountClient } from './hyperliquid-account-client';
import { HyperliquidExchangeClient } from './hyperliquid-exchange-client';

export const useHyperliquidClients = createDerivedStore(
  $ => {
    const address = $(useWalletsStore).accountAddress;
    const accountClient = new HyperliquidAccountClient(address);

    return {
      accountClient,
      address,
      exchangeClient: new HyperliquidExchangeClient(accountClient, address),
    };
  },
  { lockDependencies: true }
);

export function getHyperliquidAccountClient(): HyperliquidAccountClient {
  return useHyperliquidClients.getState().accountClient;
}

export function getHyperliquidExchangeClient(): HyperliquidExchangeClient {
  return useHyperliquidClients.getState().exchangeClient;
}
