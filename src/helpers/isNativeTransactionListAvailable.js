import { UIManager } from 'react-native';

const useNativeTransactionListAvailable = () =>
  !!UIManager.getViewManagerConfig('TransactionListView');

export default useNativeTransactionListAvailable;
