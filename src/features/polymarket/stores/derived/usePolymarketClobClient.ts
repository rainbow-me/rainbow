import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { ChainId } from '@rainbow-me/swaps';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { Chain, ClobClient } from '@polymarket/clob-client';
import { deriveSafeWalletAddress } from '@/features/polymarket/utils/deriveSafeWalletAddress';
import { BUILDER_CONFIG, POLYMARKET_CLOB_PROXY_URL, POLYMARKET_CLOB_URL } from '@/features/polymarket/constants';

export const usePolymarketClobClient = createDerivedStore(
  $ => {
    const address = $(useWalletsStore).accountAddress;
    const proxyWalletAddress = deriveSafeWalletAddress(address);

    return {
      address,
      proxyWalletAddress,
      client: (async () => {
        const wallet = await loadWallet({
          address,
          provider: getProvider({ chainId: ChainId.polygon }),
          showErrorIfNotLoaded: true,
        });
        if (!wallet) {
          logger.error(new RainbowError('[PolymarketRelayClient] Failed to load wallet for signing'));
          return undefined;
        }

        if ('_signingKey' in wallet) {
          const url = POLYMARKET_CLOB_PROXY_URL;

          const client = new ClobClient(url, Chain.POLYGON, wallet);
          let credentials = undefined;
          // `createOrDeriveApiKey` has a logic issue where it first tries to create an API key and then derive it, which results in an error if the key already exists.
          const derivedCredentials = await client.deriveApiKey();

          // Error will return object with same shape as credentials object, but all values will be undefined.
          if (derivedCredentials.key && derivedCredentials.secret && derivedCredentials.passphrase) {
            credentials = derivedCredentials;
          } else {
            credentials = await client.createApiKey();
          }

          console.log('credentials', credentials);

          // return new ClobClient(
          //   url,
          //   Chain.POLYGON,
          //   wallet,
          //   credentials,
          //   2,
          //   proxyWalletAddress
          //   // undefined, false, BUILDER_CONFIG
          // );
        } else {
          // TODO: Handle hardware wallets
          logger.error(new RainbowError('[PolymarketRelayClient] Hardware wallets are not supported for Polymarket relay transactions'));
          return undefined;
        }
      })(),
    };
  },
  { fastMode: true }
);

export async function getPolymarketClobClient(): Promise<ClobClient> {
  const client = await usePolymarketClobClient.getState().client;
  if (!client) throw new RainbowError('[Polymarket] Failed to get clob client');
  return client;
}
