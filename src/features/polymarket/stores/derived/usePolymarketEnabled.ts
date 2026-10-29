import { createDerivedStore } from '@storesjs/stores';

import { POLYMARKET } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';

export const usePolymarketEnabled = createDerivedStore($ => {
  const remoteEnabled = $(useRemoteConfigStore, s => s.getRemoteConfigKey('polymarket_enabled'));
  const locallyEnabled = $(useExperimentalConfigStore, s => s.getFlag(POLYMARKET));
  return remoteEnabled || locallyEnabled;
});
