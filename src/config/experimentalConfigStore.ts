import { createBaseStore } from '@storesjs/stores';

import { defaultConfig, defaultConfigValues, type ExperimentalConfigKey } from '@/config/experimental';
import { IS_STORE_INSTALL } from '@/env';

export type ExperimentalConfigState = {
  config: Record<ExperimentalConfigKey, boolean>;
  getFlag: (key: ExperimentalConfigKey) => boolean;
  toggleFlag: (key: ExperimentalConfigKey) => void;
};

export const useExperimentalConfigStore = createBaseStore<ExperimentalConfigState>(
  (set, get) => ({
    config: defaultConfigValues,

    getFlag: key => {
      if (IS_STORE_INSTALL) return defaultConfig[key].value;
      return get().config[key] ?? defaultConfig[key].value;
    },

    toggleFlag: key => {
      set(state => ({ config: { ...state.config, [key]: !state.config[key] } }));
    },
  }),

  { storageKey: 'experimentalConfig' }
);

export function getExperimentalFlag(key: ExperimentalConfigKey): boolean {
  return useExperimentalConfigStore.getState().getFlag(key);
}
