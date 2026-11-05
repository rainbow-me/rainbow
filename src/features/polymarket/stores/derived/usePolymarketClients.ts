import { type Signer } from '@ethersproject/abstract-signer';
import { RelayClient } from '@polymarket/builder-relayer-client';
import { Chain, ClobClient } from '@polymarket/clob-client-v2';
import { createDerivedStore } from '@storesjs/stores';
import { Wallet } from 'ethers';
import { getAddress, isAddressEqual, type Address } from 'viem';

import { BUILDER_CONFIG, POLYMARKET_CLOB_PROXY_URL, POLYMARKET_RELAYER_PROXY_URL } from '@/features/polymarket/constants';
import {
  getPolymarketWalletDescriptor,
  usePolymarketWalletStore,
  type PolymarketWalletDescriptor,
} from '@/features/polymarket/stores/polymarketWalletKindStore';
import { getPolymarketRelayChain } from '@/features/polymarket/utils/polymarketRelayChain';
import { createPolymarketWallet, type PolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { loadWallet } from '@/features/wallet/data/loadWallet';
import { getProvider } from '@/handlers/web3';
import { RainbowError } from '@/logger';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { shallowEqual } from '@/worklets/comparisons';
import { ChainId } from '@rainbow-me/swaps';

// ============ Types =========================================================== //

type PolymarketClientsState = ReturnType<typeof createClients> | typeof EMPTY_STATE;

const EMPTY_STATE = { getClobClient: null, getWallet: null, proxyAddress: null } as const;

// ============ Derived Store =================================================== //

export const usePolymarketClients = createDerivedStore<PolymarketClientsState>(
  $ => {
    const descriptor = $(usePolymarketWalletStore, s => s.getData(), shallowEqual);
    return descriptor ? createClients(descriptor) : EMPTY_STATE;
  },
  { keepAlive: true, lockDependencies: true }
);

function createClients(walletDescriptor: PolymarketWalletDescriptor) {
  const getSigningWallet = createLazyAsyncValue((authenticatedSigner?: Signer) =>
    resolveSigningWallet(walletDescriptor.owner, authenticatedSigner)
  );

  const getWallet = createLazyAsyncValue(async (authenticatedSigner?: Signer) =>
    createPolymarketWallet(walletDescriptor, createRelayClient(await getSigningWallet(authenticatedSigner)))
  );

  return {
    getClobClient: createLazyAsyncValue(async () => createClobClient(await getSigningWallet(), walletDescriptor)),
    getWallet: async (authenticatedSigner?: Signer) => {
      if (!authenticatedSigner || getAddress(await authenticatedSigner.getAddress()) === getAddress(walletDescriptor.owner)) {
        return getWallet(authenticatedSigner);
      }
      throw new RainbowError('[PolymarketClients] Signer does not belong to the captured account');
    },
    proxyAddress: walletDescriptor.address,
  };
}

// ============ Public Accessors ================================================ //

export async function getPolymarketOrderClients(holder?: Address): Promise<{ clobClient: ClobClient; wallet: PolymarketWallet }> {
  const clients = await getExecutionClients(holder);
  const [clobClient, wallet] = await Promise.all([clients.getClobClient(), clients.getWallet()]);
  return { clobClient, wallet };
}

export async function getPolymarketWallet(holder?: Address): Promise<PolymarketWallet> {
  const clients = await getExecutionClients(holder);
  return clients.getWallet();
}

async function getExecutionClients(holder?: Address) {
  const active = usePolymarketClients.getState();
  const clients = active.proxyAddress ? active : await loadClientsForSelectedAccount();

  if (!holder || isAddressEqual(holder, clients.proxyAddress)) return clients;
  throw new RainbowError('[Polymarket] Trading wallet does not match the requested account');
}

async function loadClientsForSelectedAccount() {
  const owner = useWalletsStore.getState().accountAddress;
  if (!owner) throw new RainbowError('[Polymarket] Wallet is unavailable');

  const descriptor = await getPolymarketWalletDescriptor(owner);
  const active = usePolymarketClients.getState();

  return active.proxyAddress === descriptor.address ? active : createClients(descriptor);
}

// ============ Lazy Values ===================================================== //

function createLazyAsyncValue<Value, Args extends unknown[]>(
  createValue: (...args: Args) => Promise<Value>
): (...args: Args) => Promise<Value> {
  let valuePromise: Promise<Value> | null = null;

  return (...args) => {
    if (!valuePromise) {
      valuePromise = createValue(...args).catch(error => {
        valuePromise = null;
        throw error;
      });
    }
    return valuePromise;
  };
}

async function resolveSigningWallet(address: Address, authenticatedSigner?: Signer): Promise<Wallet> {
  const wallet = authenticatedSigner ?? (await loadWallet({ address, provider: getProvider({ chainId: ChainId.polygon }) }));
  if (!wallet) throw new RainbowError('[PolymarketClients] Failed to load wallet');

  if (!(wallet instanceof Wallet)) throw new RainbowError('[PolymarketClients] Hardware wallets are not supported');

  return wallet;
}

function createRelayClient(signingWallet: Wallet): RelayClient {
  return new RelayClient(POLYMARKET_RELAYER_PROXY_URL, ChainId.polygon, signingWallet, BUILDER_CONFIG, undefined, {
    chain: getPolymarketRelayChain(),
  });
}

// ============ CLOB Client ===================================================== //

async function createClobClient(signingWallet: Wallet, descriptor: PolymarketWalletDescriptor): Promise<ClobClient> {
  const credentials = await getOrCreateApiCredentials(
    new ClobClient({
      host: POLYMARKET_CLOB_PROXY_URL,
      chain: Chain.POLYGON,
      signer: signingWallet,
    })
  );

  return new ClobClient({
    host: POLYMARKET_CLOB_PROXY_URL,
    chain: Chain.POLYGON,
    signer: signingWallet,
    creds: credentials,
    signatureType: descriptor.signatureType,
    funderAddress: descriptor.address,
    useServerTime: false,
  });
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
