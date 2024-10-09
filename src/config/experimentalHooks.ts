import { useContext } from 'react';
import { defaultConfig, defaultConfigValues } from './experimental';
import { RainbowContext } from '@/helpers/RainbowContext';
import { IS_DEV } from '@/env';
import isTestFlight from '@/helpers/isTestFlight';

const useExperimentalFlag = (name: any) => {
  if (IS_DEV || isTestFlight) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useContext(RainbowContext).config[name];
  } else {
    return defaultConfig[name].value;
  }
};

export const useExperimentalConfig = () => {
  if (IS_DEV || isTestFlight) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useContext(RainbowContext).config;
  } else {
    return defaultConfigValues;
  }
};

export default useExperimentalFlag;

export * from './experimental';
