import { Address } from 'viem';
import { HyperliquidAccountClient } from './hyperliquid-account-client';
import { HyperliquidExchangeClient } from './hyperliquid-exchange-client';
import { hyperliquidMarketsClient } from './hyperliquid-markets-client';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { ChainId } from '@/state/backendNetworks/types';
import { EthereumAddress } from '@/entities';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { Wallet } from '@ethersproject/wallet';

// TODO (kane): convert to useDerivedStore

// const useCachedUserAssetsStore = createDerivedStore<UserAssetsStoreType>(
//   $ => {
//     const address = $(useWalletsStore).accountAddress;
//     return createUserAssetsStore(address);
//   },
//   { fastMode: true }
// );

// Cache for wallet and clients to avoid reloading on every fetch
let cachedWallet: null | Wallet | LedgerSigner = null;
let cachedAccountClient: HyperliquidAccountClient | null = null;
let cachedExchangeClient: HyperliquidExchangeClient | null = null;
let cachedAddress: Address | string | null = null;

/**
 * Get the account client
 * Used for read-only operations like fetching positions and balances
 */
export function getHyperliquidAccountClient(address: Address | string): HyperliquidAccountClient {
  // Return cached client if address hasn't changed
  if (cachedAccountClient && cachedAddress === address) {
    return cachedAccountClient;
  }

  // Create and cache new account client
  cachedAccountClient = new HyperliquidAccountClient(address as Address);
  cachedAddress = address;

  return cachedAccountClient;
}

/**
 * Get the exchange client
 * Used for write operations like trading and withdrawals
 * TODO: LedgerSigner type is not supported
 */
export async function getHyperliquidExchangeClient(address: Address | string): Promise<HyperliquidExchangeClient> {
  // Return cached client if address hasn't changed
  if (cachedExchangeClient && cachedAddress === address) {
    return cachedExchangeClient;
  }

  if (!cachedWallet || cachedAddress !== address) {
    const provider = getProvider({ chainId: ChainId.arbitrum });
    const wallet = await loadWallet({
      address: address as EthereumAddress,
      provider,
      showErrorIfNotLoaded: false,
    });

    if (!wallet) {
      throw new Error('Failed to load wallet for signing');
    }

    cachedWallet = wallet;
  }

  // Create and cache new exchange client
  cachedExchangeClient = new HyperliquidExchangeClient(address as Address, cachedWallet as Wallet);
  cachedAddress = address;

  return cachedExchangeClient;
}

export function clearHyperliquidClientCache() {
  cachedWallet = null;
  cachedAccountClient = null;
  cachedExchangeClient = null;
  cachedAddress = null;
}

export { hyperliquidMarketsClient };
