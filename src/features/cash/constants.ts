import { ChainId, ChainName } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';

import { USES_STAGING_PLATFORM } from './services/cashPlatformClient';
import { RampCryptoAsset, RampNetwork, type RampAsset } from './services/rampClient';

export const USDC_NAME = 'USD Coin';
export const USDC_SYMBOL = 'USDC';
export const USDC_DECIMALS = 6;

export const ORDER_FAST_POLL_INTERVAL_MS = time.seconds(2);
export const ORDER_FAST_POLL_DURATION_MS = time.minutes(5);
export const ORDER_SLOW_POLL_INTERVAL_MS = time.seconds(15);

/** Each platform admits exactly one destination: production `usdc/base`, staging `usdc/arbitrum_testnet`. */
export const CASH_BUY_DESTINATION_ASSET: RampAsset = {
  asset: RampCryptoAsset.USDC,
  network: USES_STAGING_PLATFORM ? RampNetwork.ArbitrumTestnet : RampNetwork.Base,
};

/**
 * USDC deployments the ramp can deposit to, keyed by the wire `RampNetwork`. The
 * backend returns only the asset/network enums, never the on-chain address, so the
 * cash feature owns it — as perps (HYPERLIQUID_USDC_ADDRESS) and polymarket
 * (POLYGON_USDC_ADDRESS) own theirs. Chain ids are pinned here rather than resolved
 * through the backend networks store, which never returns testnets.
 */
export const CASH_USDC_BY_NETWORK: Record<RampAsset['network'], { chainId: ChainId; chainName: ChainName; address: string }> = {
  [RampNetwork.ArbitrumTestnet]: {
    chainId: ChainId.arbitrumSepolia,
    chainName: ChainName.arbitrumSepolia,
    address: '0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d',
  },
  [RampNetwork.Base]: { chainId: ChainId.base, chainName: ChainName.base, address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' },
};
