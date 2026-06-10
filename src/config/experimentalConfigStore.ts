import { defaultConfig, defaultConfigValues, type ExperimentalConfigKey } from '@/config/experimental';
import { IS_STORE_INSTALL } from '@/env';
import { time } from '@/framework/core/utils/time';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type ExperimentalConfigState = {
  config: Record<ExperimentalConfigKey, boolean>;
  getFlag: (key: ExperimentalConfigKey) => boolean;
  toggleFlag: (key: ExperimentalConfigKey) => void;
};

export const useExperimentalConfigStore = createRainbowStore<ExperimentalConfigState>(
  (set, get) => ({
    config: defaultConfigValues,

    getFlag: key => {
      if (IS_STORE_INSTALL) return defaultConfig[key].value;
      return get().config[key] ?? defaultConfig[key].value;
    },

    toggleFlag: key => {
      set(state => ({ config: { ...state.config, [key]: !(state.config[key] ?? defaultConfig[key].value) } }));
    },
  }),

  { persistThrottleMs: time.zero, storageKey: 'experimentalConfig' }
);

export function getExperimentalFlag(key: ExperimentalConfigKey): boolean {
  return useExperimentalConfigStore.getState().getFlag(key);
}
