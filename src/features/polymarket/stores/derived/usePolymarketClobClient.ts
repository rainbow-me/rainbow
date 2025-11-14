import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { ChainId } from '@rainbow-me/swaps';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { Chain, ClobClient } from '@polymarket/clob-client';
import { deriveSafeWalletAddress } from '@/features/polymarket/utils/derive-safe-wallet-address';

const builderConfig = new BuilderConfig({
  remoteBuilderConfig: { url: '<http://localhost:3000/sign>' },
});

const CLOB_URL = 'https://clob.polymarket.com/';

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
          const creds = await new ClobClient(CLOB_URL, Chain.POLYGON, wallet).createOrDeriveApiKey();

          return new ClobClient(
            CLOB_URL,
            Chain.POLYGON,
            wallet,
            creds,
            2,
            proxyWalletAddress
            // undefined,
            // false,
            // builderConfig
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
