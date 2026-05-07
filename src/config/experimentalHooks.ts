import { IS_STORE_INSTALL } from '@/env';

import { defaultConfig, defaultConfigValues, type ExperimentalConfigKey } from './experimental';
import { useExperimentalConfigStore } from './experimentalConfigStore';

const useExperimentalFlag = (name: ExperimentalConfigKey) =>
  useExperimentalConfigStore(state => (IS_STORE_INSTALL ? defaultConfig[name].value : (state.config[name] ?? defaultConfig[name].value)));

export const useExperimentalConfig = () => useExperimentalConfigStore(state => (IS_STORE_INSTALL ? defaultConfigValues : state.config));

export default useExperimentalFlag;

export { getExperimentalFlag } from './experimentalConfigStore';
export * from './experimental';
