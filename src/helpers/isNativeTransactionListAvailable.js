import { UIManager } from 'react-native';
import { nativeTransactionListAvailable } from '../config/experimental';

export default nativeTransactionListAvailable &&
  !!UIManager.getViewManagerConfig('TransactionListView');
