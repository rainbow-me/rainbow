import { UIManager } from 'react-native';
import useExperimentalFlag, {
  NATIVE_TRANSACTION_LIST,
} from '../config/experimentalHooks';

const useNativeTransactionListAvailable = () => {
  const nativeTransactionListAvailable = useExperimentalFlag(
    NATIVE_TRANSACTION_LIST
  );

  return (
    nativeTransactionListAvailable &&
    !!UIManager.getViewManagerConfig('TransactionListView')
  );
};

export default useNativeTransactionListAvailable;
