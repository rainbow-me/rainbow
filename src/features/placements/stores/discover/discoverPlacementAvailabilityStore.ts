import { defaultConfig, POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { IS_STORE_INSTALL, IS_TEST } from '@/env';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { useRemoteConfigStore } from '@/model/remoteConfig';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';

export type DiscoverPlacementAvailability = {
  [PLACEMENT_IDS.DISCOVER_PERPS_CAROUSEL]: boolean;
  [PLACEMENT_IDS.DISCOVER_PREDICTIONS_CAROUSEL]: boolean;
  enabled: boolean;
};

export const useDiscoverPlacementAvailability = createDerivedStore<DiscoverPlacementAvailability>(
  $ => {
    const { discover_placements_enabled, perps_enabled, polymarket_enabled } = $(
      useRemoteConfigStore,
      state => {
        const { discover_placements_enabled, perps_enabled, polymarket_enabled } = state.config;
        return { discover_placements_enabled, perps_enabled, polymarket_enabled };
      },
      shallowEqual
    );
    const polymarketLocal = $(useExperimentalConfigStore, state =>
      IS_STORE_INSTALL ? defaultConfig[POLYMARKET].value : (state.config[POLYMARKET] ?? defaultConfig[POLYMARKET].value)
    );

    const placements = discover_placements_enabled && !IS_TEST;
    const perps = placements && perps_enabled;
    const predictions = placements && (polymarket_enabled || polymarketLocal);

    return {
      enabled: perps || predictions,
      [PLACEMENT_IDS.DISCOVER_PERPS_CAROUSEL]: perps,
      [PLACEMENT_IDS.DISCOVER_PREDICTIONS_CAROUSEL]: predictions,
    };
  },
  { equalityFn: shallowEqual }
);
