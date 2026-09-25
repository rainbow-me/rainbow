import { createDerivedStore } from '@storesjs/stores';

import { POLYMARKET } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';

/**
 * Whether Sports and Polymarket are enabled by remote config or the local experimental flag.
 */
export const useSportsEnabled = createDerivedStore($ => {
  const remoteEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('polymarket_enabled'));
  const locallyEnabled = $(useExperimentalConfigStore, state => state.getFlag(POLYMARKET));
  return remoteEnabled || locallyEnabled;
});
