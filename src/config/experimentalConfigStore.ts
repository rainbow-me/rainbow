import {
  defaultConfigValues,
  EXPERIMENTAL_CONFIG_STORAGE_KEY,
  experimentalConfigStorage,
  type ExperimentalConfigKey,
} from '@/config/experimental';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type ExperimentalConfigState = {
  config: Record<ExperimentalConfigKey, boolean>;
  setConfig: (config: Record<ExperimentalConfigKey, boolean>) => void;
  toggleFlag: (key: ExperimentalConfigKey) => void;
};

export const useExperimentalConfigStore = createRainbowStore<ExperimentalConfigState>((set, get) => ({
  config: readExperimentalConfig(),
  setConfig: config => {
    experimentalConfigStorage.set(EXPERIMENTAL_CONFIG_STORAGE_KEY, JSON.stringify(config));
    set({ config });
  },
  toggleFlag: key => {
    const currentConfig = get().config;
    get().setConfig({ ...currentConfig, [key]: !currentConfig[key] });
  },
}));

function readExperimentalConfig(): Record<ExperimentalConfigKey, boolean> {
  const persistedConfig = experimentalConfigStorage.getString(EXPERIMENTAL_CONFIG_STORAGE_KEY);
  if (!persistedConfig) return defaultConfigValues;

  try {
    return {
      ...defaultConfigValues,
      ...(JSON.parse(persistedConfig) as Partial<Record<ExperimentalConfigKey, boolean>>),
    };
  } catch {
    return defaultConfigValues;
  }
}
