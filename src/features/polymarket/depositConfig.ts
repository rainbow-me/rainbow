import { analytics } from '@/analytics';
import { predictSponsoredCallsExecution } from '@/features/delegation/sponsoredCalls';
import { USDC_ICON_URL } from '@/features/perps/constants';
import { time } from '@/framework/core/utils/time';
import { getRemoteConfig } from '@/model/remoteConfig';
import { ChainId } from '@/state/backendNetworks/types';
import { createDepositConfig } from '@/systems/funding/config';

import { POLYGON_USDC_ADDRESS, POLYGON_USDC_DECIMALS } from './constants';
import { usePolymarketProxyAddress } from './stores/derived/usePolymarketProxyAddress';
import { handlePolymarketDepositSubmitted } from './utils/handlePolymarketDepositSubmitted';
import { refetchPolymarketBalance } from './utils/refetchPolymarketStores';

// ============ Polymarket Deposit Configuration =============================== //

export const POLYMARKET_DEPOSIT_CONFIG = createDepositConfig({
  id: 'polymarketDeposit',
  directTransferEnabled: true,
  onSubmit: handlePolymarketDepositSubmitted,

  quote: {
    feeBps: 0,
    slippage: 1,
  },

  to: {
    chainId: ChainId.polygon,
    token: {
      address: POLYGON_USDC_ADDRESS,
      decimals: POLYGON_USDC_DECIMALS,
      symbol: 'USDC',
      displaySymbol: 'USDC',
      iconUrl: USDC_ICON_URL,
    },
    recipient: usePolymarketProxyAddress,
  },

  gas: {
    predictIsSponsored: ({ accountAddress, asset }) => {
      return (
        getRemoteConfig().sponsored_polymarket_deposits_enabled &&
        predictSponsoredCallsExecution({
          address: accountAddress,
          chainId: asset.chainId,
        })
      );
    },
  },

  refresh: {
    delays: [time.seconds(1), time.seconds(3), time.seconds(6)],
    handler: refetchPolymarketBalance,
  },

  trackFailure: metadata => analytics.track(analytics.event.predictionsDepositFailed, metadata),
  trackSuccess: metadata => analytics.track(analytics.event.predictionsDeposit, metadata),
});
