import { useContext } from 'react';
import { defaultConfig } from './experimental';
import { RainbowContext } from '@rainbow-me/helpers/RainbowContext';

const useExperimentalFlag = name => {
  if (IS_DEV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useContext(RainbowContext).config[name];
  } else {
    return defaultConfig[name];
  }
};
export default useExperimentalFlag;

export * from './experimental';
