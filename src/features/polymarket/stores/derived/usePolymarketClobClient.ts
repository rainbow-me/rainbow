import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { ChainId } from '@rainbow-me/swaps';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { Chain, ClobClient } from '@polymarket/clob-client';
import { deriveSafeWalletAddress } from '@/features/polymarket/utils/deriveSafeWalletAddress';
import { BUILDER_CONFIG, POLYMARKET_CLOB_PROXY_URL } from '@/features/polymarket/constants';

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
          const creds = await new ClobClient(POLYMARKET_CLOB_PROXY_URL, Chain.POLYGON, wallet).createOrDeriveApiKey();

          return new ClobClient(
            POLYMARKET_CLOB_PROXY_URL,
            Chain.POLYGON,
            wallet,
            creds,
            2,
            proxyWalletAddress,
            undefined,
            false,
            BUILDER_CONFIG
          );
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

export async function getPolymarketClobClient(): Promise<ClobClient | undefined> {
  return await usePolymarketClobClient.getState().client;
}
