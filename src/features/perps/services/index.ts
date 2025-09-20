import { Address } from 'viem';
import { HyperliquidAccountClient } from './hyperliquid-account-client';
import { HyperliquidExchangeClient } from './hyperliquid-exchange-client';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { ChainId } from '@/state/backendNetworks/types';
import { EthereumAddress } from '@/entities';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { Wallet } from '@ethersproject/wallet';
import watchingAlert from '@/utils/watchingAlert';
import { getWalletWithAccount, useWalletsStore } from '@/state/wallets/walletsStore';
import WalletTypes from '@/helpers/walletTypes';
import { createDerivedStore } from '@/state/internal/createDerivedStore';

function checkIfReadOnlyWallet(address: string): boolean {
  const wallet = getWalletWithAccount(address);
  if (wallet?.type === WalletTypes.readOnly) {
    watchingAlert();
    return true;
  }
  return false;
}

/**
 * Derived store for account clients
 * Automatically creates and caches clients when the wallet address changes
 */
const useHyperliquidAccountClientStore = createDerivedStore($ => {
  const address = $(useWalletsStore).accountAddress;
  if (!address) return null;

  return new HyperliquidAccountClient(address as Address);
});

/**
 * Get the account client
 * Used for read-only operations like fetching positions and balances
 */
export function getHyperliquidAccountClient(address: Address | string): HyperliquidAccountClient {
  // First check if we're using the current wallet's address
  const currentAddress = useWalletsStore.getState().accountAddress;
  if (address === currentAddress) {
    const client = useHyperliquidAccountClientStore.getState();
    if (client) return client;
  }

  // For other addresses, create a new client on demand
  return new HyperliquidAccountClient(address as Address);
}

// Cache for wallets only, since loading them is async and expensive
let cachedWallet: { address: string; wallet: Wallet | LedgerSigner } | null = null;

/**
 * Get the exchange client
 * Used for write operations like trading and withdrawals
 * TODO: LedgerSigner type is not supported
 */
export async function getHyperliquidExchangeClient(address: Address | string): Promise<HyperliquidExchangeClient | undefined> {
  if (checkIfReadOnlyWallet(address)) {
    return;
  }

  // Load wallet if we don't have it cached for this address
  if (!cachedWallet || cachedWallet.address !== address) {
    const provider = getProvider({ chainId: ChainId.arbitrum });
    const wallet = await loadWallet({
      address: address as EthereumAddress,
      provider,
      showErrorIfNotLoaded: false,
    });

    if (!wallet) {
      throw new Error('Failed to load wallet for signing');
    }

    cachedWallet = { address: String(address), wallet };
  }

  // Create and return the exchange client
  return new HyperliquidExchangeClient(address as Address, cachedWallet.wallet as Wallet);
}

export function clearHyperliquidClientCache() {
  cachedWallet = null;
}
