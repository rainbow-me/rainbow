import { defaultConfig, defaultConfigValues, type ExperimentalConfigKey } from '@/config/experimental';
import { IS_STORE_INSTALL } from '@/env';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type ExperimentalConfigState = {
  config: Record<ExperimentalConfigKey, boolean>;
  setConfig: (config: Record<ExperimentalConfigKey, boolean>) => void;
  toggleFlag: (key: ExperimentalConfigKey) => void;
};

export const useExperimentalConfigStore = createRainbowStore<ExperimentalConfigState>(
  (set, get) => ({
    config: defaultConfigValues,
    setConfig: config => set({ config }),
    toggleFlag: key => {
      const current = get().config;
      set({ config: { ...current, [key]: !current[key] } });
    },
  }),
  { storageKey: 'experimentalConfig' }
);

export function getExperimentalFlag(key: ExperimentalConfigKey): boolean {
  if (IS_STORE_INSTALL) return defaultConfig[key].value;
  return useExperimentalConfigStore.getState().config[key] ?? defaultConfig[key].value;
}
