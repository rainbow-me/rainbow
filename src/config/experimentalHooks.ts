import { IS_INTERNAL } from '@/env';

import { defaultConfig, defaultConfigValues, type ExperimentalConfigKey } from './experimental';
import { useExperimentalConfigStore } from './experimentalConfigStore';

const useExperimentalFlag = (name: ExperimentalConfigKey) =>
  useExperimentalConfigStore(state => (IS_INTERNAL ? (state.config[name] ?? defaultConfig[name].value) : defaultConfig[name].value));

export const useExperimentalConfig = () => useExperimentalConfigStore(state => (IS_INTERNAL ? state.config : defaultConfigValues));

export default useExperimentalFlag;

export * from './experimental';
