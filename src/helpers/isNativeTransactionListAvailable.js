import { UIManager } from 'react-native';
import { nativeTransactionListAvailable } from '../experimentalConfig';

export default nativeTransactionListAvailable &&
  !!UIManager.getViewManagerConfig('TransactionListView');
