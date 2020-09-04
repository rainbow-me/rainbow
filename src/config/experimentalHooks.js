import { useContext } from 'react';
import { DevContext } from '../helpers/DevContext';
import { defaultConfig } from './experimental';

const useExperimentalFlag = name => {
  if (IS_DEV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useContext(DevContext).config[name];
  } else {
    return defaultConfig[name];
  }
};
export default useExperimentalFlag;

export * from './experimental';
