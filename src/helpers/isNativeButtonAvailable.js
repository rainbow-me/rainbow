import { UIManager } from 'react-native';
import useExperimentalFlag, { NATIVE_BPA } from '../config/experimentalHooks';

const useNativeButtonAvailable = () => {
  const nativeTransactionListAvailable = useExperimentalFlag(NATIVE_BPA);

  return (
    nativeTransactionListAvailable && !!UIManager.getViewManagerConfig('Button')
  );
};

export default useNativeButtonAvailable;
