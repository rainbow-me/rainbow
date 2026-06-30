import { time } from '@/framework/core/utils/time';

import { RampNetwork } from './services/rampClient';

export const USDC_NAME = 'USD Coin';
export const USDC_SYMBOL = 'USDC';
export const USDC_DECIMALS = 6;

export const ORDER_POLL_INTERVAL_MS = time.seconds(2);

/**
 * USDC deployments the ramp can deposit to, keyed by the wire `RampNetwork`. The
 * backend returns only the asset/network enums, never the on-chain address, so the
 * cash feature owns it — as perps (HYPERLIQUID_USDC_ADDRESS) and polymarket
 * (POLYGON_USDC_ADDRESS) own theirs. `chainName` resolves to a ChainId at call time
 * via the backend networks store.
 */
export const CASH_USDC_BY_NETWORK: Partial<Record<RampNetwork, { chainName: string; address: string }>> = {
  [RampNetwork.Arbitrum]: { chainName: 'arbitrum', address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831' },
  [RampNetwork.Base]: { chainName: 'base', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' },
};
