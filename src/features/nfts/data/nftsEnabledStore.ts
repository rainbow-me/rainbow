import { createDerivedStore } from '@storesjs/stores';

import { NFTS_ENABLED } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';

/** Whether NFT content is enabled by remote or experimental configuration. */
export const useNftsEnabled = createDerivedStore(
  $ => {
    const remoteEnabled = $(useRemoteConfigStore, s => s.getRemoteConfigKey('nfts_enabled'));
    const experimentalEnabled = $(useExperimentalConfigStore, s => s.getFlag(NFTS_ENABLED));
    return remoteEnabled || experimentalEnabled;
  },
  { lockDependencies: true }
);
