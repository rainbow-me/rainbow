import { IS_STORE_INSTALL } from '@/env';

import { defaultConfig, defaultConfigValues, type ExperimentalConfigKey } from '../constants/experimental';
import { useExperimentalConfigStore } from '../stores/experimentalConfigStore';

export const useExperimentalFlag = (name: ExperimentalConfigKey) =>
  useExperimentalConfigStore(state => (IS_STORE_INSTALL ? defaultConfig[name].value : (state.config[name] ?? defaultConfig[name].value)));

export const useExperimentalConfig = () => useExperimentalConfigStore(state => (IS_STORE_INSTALL ? defaultConfigValues : state.config));
