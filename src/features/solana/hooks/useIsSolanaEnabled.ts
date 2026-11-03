import { createDerivedStore } from '@storesjs/stores';

import { SOLANA } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';

/**
 * Solana is gated by the remote `solana_enabled` flag in production.
 * The `SOLANA` experimental flag is an in-app override in Developer Settings.
 */
export const useIsSolanaEnabled = createDerivedStore(
  $ => {
    const remoteEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('solana_enabled'));
    const experimentalEnabled = $(useExperimentalConfigStore, state => state.getFlag(SOLANA));

    return remoteEnabled || experimentalEnabled;
  },
  { lockDependencies: true }
);
