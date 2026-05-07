import { createMMKV } from 'react-native-mmkv';

import { defaultConfigValues, type ExperimentalConfigKey } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { logger, RainbowError } from '@/logger';
import { MigrationName, type Migration } from '@/migrations/types';
import { STORAGE_IDS } from '@/model/mmkv';

const legacyStorage = createMMKV({ id: STORAGE_IDS.EXPERIMENTAL_CONFIG });

export function migrateExperimentalFlags(): Migration {
  return {
    name: MigrationName.migrateExperimentalFlags,
    async migrate() {
      const legacy = legacyStorage.getString('config');
      if (!legacy) return;
      try {
        const parsed = JSON.parse(legacy) as Partial<Record<ExperimentalConfigKey, boolean>>;
        useExperimentalConfigStore.getState().setConfig({ ...defaultConfigValues, ...parsed });
      } catch (error) {
        logger.error(new RainbowError('[migrateExperimentalFlags]: failed to parse legacy MMKV blob', error));
      }
      legacyStorage.remove('config');
    },
  };
}
