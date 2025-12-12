import { ChainId } from '@rainbow-me/swaps';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { Chain, ClobClient } from '@polymarket/clob-client';
import { BUILDER_CONFIG, POLYMARKET_CLOB_PROXY_URL } from '@/features/polymarket/constants';
import { Address } from 'viem';
import { usePolymarketProxyAddress } from '@/features/polymarket/stores/derived/usePolymarketProxyAddress';

// Module-level cache for the clob client
let cachedClientPromise: Promise<ClobClient | undefined> | null = null;
let cachedForAddress: string | null = null;

async function createClient(address: Address, proxyWalletAddress: Address): Promise<ClobClient | undefined> {
  const wallet = await loadWallet({
    address,
    provider: getProvider({ chainId: ChainId.polygon }),
    showErrorIfNotLoaded: true,
  });

  if (!wallet) {
    logger.error(new RainbowError('[PolymarketClobClient] Failed to load wallet for signing'));
    return undefined;
  }

  if (!('_signingKey' in wallet)) {
    logger.error(new RainbowError('[PolymarketClobClient] Unexpected wallet type'));
    return undefined;
  }

  const credentialsClient = new ClobClient(POLYMARKET_CLOB_PROXY_URL, Chain.POLYGON, wallet);
  let credentials = undefined;
  // `createOrDeriveApiKey` has a logic issue where it first tries to create an API key and then derive it, which results in an error if the key already exists.
  const derivedCredentials = await credentialsClient.deriveApiKey();

  // Error will return object with same shape as credentials object, but all values will be undefined.
  if (derivedCredentials.key && derivedCredentials.secret && derivedCredentials.passphrase) {
    credentials = derivedCredentials;
  } else {
    credentials = await credentialsClient.createApiKey();
  }

  return new ClobClient(
    POLYMARKET_CLOB_PROXY_URL,
    Chain.POLYGON,
    wallet,
    credentials,
    2,
    proxyWalletAddress,
    undefined,
    false,
    BUILDER_CONFIG
  );
}

export async function getPolymarketClobClient(): Promise<ClobClient> {
  const { address, proxyAddress } = usePolymarketProxyAddress.getState();

  if (cachedForAddress !== address || !cachedClientPromise) {
    cachedForAddress = address;
    cachedClientPromise = createClient(address, proxyAddress);
  }

  const client = await cachedClientPromise;
  if (!client) {
    cachedClientPromise = null;
    throw new RainbowError('[Polymarket] Failed to get clob client');
  }
  return client;
}
