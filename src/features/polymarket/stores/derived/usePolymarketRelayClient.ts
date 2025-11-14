import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { RelayClient } from '@polymarket/builder-relayer-client';
import { ChainId } from '@rainbow-me/swaps';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { usePolymarketProxyAddress } from '@/features/polymarket/stores/derived/usePolymarketProxyAddress';
import { POLYGON_USDC_ADDRESS, POLYMARKET_CTF_ADDRESS } from '@/features/polymarket/constants';
import { ethers } from 'ethers';
import { erc20ABI } from '@/references';
import { deriveSafeWalletAddress } from '@/features/polymarket/utils/derive-safe-wallet-address';
import { equalWorklet } from '@/safe-math/SafeMath';

const builderConfig = new BuilderConfig({
  remoteBuilderConfig: { url: '<http://localhost:3000/sign>' },
});

const RELAYER_URL = 'https://relayer-v2.polymarket.com/';

export const usePolymarketRelayClient = createDerivedStore(
  $ => {
    const address = $(useWalletsStore).accountAddress;
    const proxyAddress = $(usePolymarketProxyAddress).proxyAddress;

    return {
      address,
      proxyAddress,
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
          return new RelayClient(
            RELAYER_URL,
            ChainId.polygon,
            wallet
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

export async function getPolymarketRelayClient(): Promise<RelayClient | undefined> {
  return await usePolymarketRelayClient.getState().client;
}

export async function deploySafeProxyWallet(): Promise<void> {
  const client = await getPolymarketRelayClient();
  if (!client) return;

  const response = await client.deploy();
  const result = await response.wait();
  console.log('result', JSON.stringify(result, null, 2));
}

async function isUsdcMaxApprovedForCtf(address: string): Promise<boolean> {
  const usdcContract = new ethers.Contract(POLYGON_USDC_ADDRESS, erc20ABI, getProvider({ chainId: ChainId.polygon }));

  const safeAddress = deriveSafeWalletAddress(address);

  const currentAllowance = await usdcContract.allowance(safeAddress, POLYMARKET_CTF_ADDRESS);

  console.log('currentAllowance', currentAllowance);

  return equalWorklet(currentAllowance, ethers.constants.MaxUint256.toString());
}
