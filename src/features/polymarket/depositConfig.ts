import { analytics } from '@/analytics';
import { USDC_ICON_URL } from '@/features/perps/constants';
import { ChainId } from '@/state/backendNetworks/types';
import { createDepositConfig } from '@/systems/funding/config';
import { time } from '@/utils/time';
import { POLYGON_USDC_ADDRESS } from './constants';
import { usePolymarketProxyAddress } from './stores/derived/usePolymarketProxyAddress';
import { ensureProxyWalletDeployedAndUsdcApproved } from './utils/proxyWallet';
import { refetchPolymarketBalance } from './utils/refetchPolymarketStores';

// ============ Polymarket Deposit Configuration =============================== //

export const POLYMARKET_DEPOSIT_CONFIG = createDepositConfig({
  id: 'polymarketDeposit',
  directTransferEnabled: true,
  onSubmit: ensureProxyWalletDeployedAndUsdcApproved,

  quote: {
    feeBps: 0,
    slippage: 1,
  },

  to: {
    chainId: ChainId.polygon,
    token: {
      address: POLYGON_USDC_ADDRESS,
      decimals: 6,
      symbol: 'USDC',
      displaySymbol: 'USDC',
      iconUrl: USDC_ICON_URL,
    },
    recipient: usePolymarketProxyAddress,
  },

  refresh: {
    delays: [time.seconds(1), time.seconds(3), time.seconds(6)],
    handler: refetchPolymarketBalance,
  },

  trackFailure: metadata => analytics.track(analytics.event.predictionsDepositFailed, metadata),
  trackSuccess: metadata => analytics.track(analytics.event.predictionsDeposit, metadata),
});
