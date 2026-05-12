import { createMMKV } from 'react-native-mmkv';

import { defaultConfigValues, type ExperimentalConfigKey } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { logger, RainbowError } from '@/logger';
import { MigrationName, type Migration } from '@/migrations/types';

const LEGACY_STORAGE_KEY = 'EXPERIMENTAL_CONFIG';

export function migrateExperimentalFlags(): Migration {
  const legacyStorage = createMMKV({ id: LEGACY_STORAGE_KEY });

  return {
    name: MigrationName.migrateExperimentalFlags,
    async migrate() {
      const legacy = legacyStorage.getString('config');
      if (!legacy) return;
      try {
        const parsed: Partial<Record<ExperimentalConfigKey, boolean>> = JSON.parse(legacy);
        useExperimentalConfigStore.setState({ config: { ...defaultConfigValues, ...parsed } });
      } catch (error) {
        logger.error(new RainbowError('[migrateExperimentalFlags]: failed to parse legacy MMKV blob', error));
      }
      legacyStorage.clearAll();
    },
  };
}
