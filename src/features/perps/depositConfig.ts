import { createDepositConfig } from '@/systems/funding/config';
import { time } from '@/utils/time';
import { HYPERCORE_PSEUDO_CHAIN_ID, HYPERLIQUID_USDC_ADDRESS, USDC_ICON_URL } from './constants';
import { refetchHyperliquidStores } from './utils';

// ============ Perps Deposit Configuration ================================= //

export const PERPS_DEPOSIT_CONFIG = createDepositConfig({
  id: 'perpsDeposit',
  directTransferEnabled: false,

  quote: {
    feeBps: 0,
    slippage: 1,
  },

  to: {
    chainId: HYPERCORE_PSEUDO_CHAIN_ID,
    token: {
      address: HYPERLIQUID_USDC_ADDRESS,
      decimals: 8,
      symbol: 'USDC',
      displaySymbol: 'USDC',
      iconUrl: USDC_ICON_URL,
    },
  },

  refresh: {
    delays: [time.seconds(1), time.seconds(3), time.seconds(6)],
    handler: refetchHyperliquidStores,
  },
});
