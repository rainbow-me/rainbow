import { useContext } from 'react';

import { IS_INTERNAL } from '@/env';
import { RainbowContext } from '@/helpers/RainbowContext';

import { defaultConfig, defaultConfigValues, type ExperimentalConfigKey } from './experimental';

const useExperimentalFlag = (name: ExperimentalConfigKey) => {
  if (IS_INTERNAL) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useContext(RainbowContext).config[name];
  } else {
    return defaultConfig[name].value;
  }
};

export const useExperimentalConfig = () => {
  if (IS_INTERNAL) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useContext(RainbowContext).config;
  } else {
    return defaultConfigValues;
  }
};

export default useExperimentalFlag;

export * from './experimental';
