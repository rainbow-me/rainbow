import { ClobClient, Chain } from '@polymarket/clob-client';
import { RelayClient } from '@polymarket/builder-relayer-client';
import { ChainId } from '@rainbow-me/swaps';
import { Wallet } from 'ethers';
import { Address } from 'viem';
import { BUILDER_CONFIG, POLYMARKET_CLOB_PROXY_URL, POLYMARKET_RELAYER_PROXY_URL } from '@/features/polymarket/constants';
import { deriveSafeWalletAddress } from '@/features/polymarket/utils/deriveSafeWalletAddress';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';

// ============ Types =========================================================== //

type PolymarketClientsState = {
  address: Address;
  getClobClient: () => Promise<ClobClient | null>;
  getRelayClient: () => Promise<RelayClient | null>;
  proxyAddress: Address | null;
};

// ============ Derived Store =================================================== //

export const usePolymarketClients = createDerivedStore<PolymarketClientsState>(
  $ => {
    const address = $(useWalletsStore).accountAddress;
    const proxyAddress = address ? deriveSafeWalletAddress(address) : null;
    const getWallet = createLazyWallet(address);

    return {
      address,
      getClobClient: createLazyClobClient(getWallet, proxyAddress),
      getRelayClient: createLazyRelayClient(getWallet),
      proxyAddress,
    };
  },
  { fastMode: true, keepAlive: true }
);

// ============ Public Accessors ================================================ //

export async function getPolymarketRelayClient(): Promise<RelayClient> {
  const client = await usePolymarketClients.getState().getRelayClient();
  if (!client) throw new RainbowError('[Polymarket] Failed to get relay client');
  return client;
}

export async function getPolymarketClobClient(): Promise<ClobClient> {
  const client = await usePolymarketClients.getState().getClobClient();
  if (!client) throw new RainbowError('[Polymarket] Failed to get CLOB client');
  return client;
}

// ============ Lazy Wallet ===================================================== //

function createLazyWallet(address: Address): () => Promise<Wallet | null> {
  let walletPromise: Promise<Wallet | null> | null = null;

  return async () => {
    if (!walletPromise) {
      walletPromise = loadWalletForAddress(address).catch(error => {
        walletPromise = null;
        throw error;
      });
    }
    return walletPromise;
  };
}

async function loadWalletForAddress(address: Address): Promise<Wallet | null> {
  if (!address) return null;

  const wallet = await loadWallet({
    address,
    provider: getProvider({ chainId: ChainId.polygon }),
  });

  if (!wallet) {
    logger.error(new RainbowError('[PolymarketClients] Failed to load wallet'));
    return null;
  }

  if (!('_signingKey' in wallet)) {
    logger.error(new RainbowError('[PolymarketClients] Hardware wallets are not supported'));
    return null;
  }

  return wallet;
}

// ============ Lazy Relay Client =============================================== //

function createLazyRelayClient(getWallet: () => Promise<Wallet | null>): () => Promise<RelayClient | null> {
  let clientPromise: Promise<RelayClient | null> | null = null;

  return async () => {
    if (!clientPromise) {
      clientPromise = createRelayClientFromWallet(getWallet).catch(error => {
        clientPromise = null;
        throw error;
      });
    }
    return clientPromise;
  };
}

async function createRelayClientFromWallet(getWallet: () => Promise<Wallet | null>): Promise<RelayClient | null> {
  const wallet = await getWallet();
  if (!wallet) return null;
  return new RelayClient(POLYMARKET_RELAYER_PROXY_URL, ChainId.polygon, wallet, BUILDER_CONFIG);
}

// ============ Lazy CLOB Client ================================================ //

function createLazyClobClient(getWallet: () => Promise<Wallet | null>, proxyAddress: Address | null): () => Promise<ClobClient | null> {
  let clientPromise: Promise<ClobClient | null> | null = null;

  return async () => {
    if (!clientPromise) {
      clientPromise = createClobClientFromWallet(getWallet, proxyAddress).catch(error => {
        clientPromise = null;
        throw error;
      });
    }
    return clientPromise;
  };
}

async function createClobClientFromWallet(
  getWallet: () => Promise<Wallet | null>,
  proxyAddress: Address | null
): Promise<ClobClient | null> {
  const wallet = await getWallet();
  if (!wallet) return null;

  const credentials = await getOrCreateApiCredentials(new ClobClient(POLYMARKET_CLOB_PROXY_URL, Chain.POLYGON, wallet));

  return new ClobClient(
    POLYMARKET_CLOB_PROXY_URL,
    Chain.POLYGON,
    wallet,
    credentials,
    2,
    proxyAddress ?? undefined,
    undefined,
    false,
    BUILDER_CONFIG
  );
}

async function getOrCreateApiCredentials(client: ClobClient) {
  const derived = await client.deriveApiKey();
  if (derived.key && derived.secret && derived.passphrase) {
    return derived;
  }
  const created = await client.createApiKey();
  if (!created.key || !created.secret || !created.passphrase) {
    throw new RainbowError('[Polymarket] Failed to obtain valid API credentials');
  }
  return created;
}
