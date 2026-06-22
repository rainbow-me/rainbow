import { IS_STORE_INSTALL } from '@/env';
import { time } from '@/framework/core/utils/time';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

import { defaultConfig, defaultConfigValues, type ExperimentalConfigKey } from '../constants/experimental';

export type ExperimentalConfigState = {
  config: Record<ExperimentalConfigKey, boolean>;
  getFlag: (key: ExperimentalConfigKey) => boolean;
  setFlag: (key: ExperimentalConfigKey, value: boolean) => void;
  toggleFlag: (key: ExperimentalConfigKey) => void;
};

export const useExperimentalConfigStore = createRainbowStore<ExperimentalConfigState>(
  (set, get) => ({
    config: defaultConfigValues,

    getFlag: key => {
      if (IS_STORE_INSTALL) return defaultConfig[key].value;
      return get().config[key] ?? defaultConfig[key].value;
    },

    setFlag: (key, value) => {
      set(state => ({ config: { ...state.config, [key]: value } }));
    },

    toggleFlag: key => {
      get().setFlag(key, !(get().config[key] ?? defaultConfig[key].value));
    },
  }),

  { persistThrottleMs: time.zero, storageKey: 'experimentalConfig' }
);

export function getExperimentalFlag(key: ExperimentalConfigKey): boolean {
  return useExperimentalConfigStore.getState().getFlag(key);
}
