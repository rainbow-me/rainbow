import { withSendComponentWithData } from '../components/SendComponentWithData';
import { sendTransaction } from '../model/wallet';
import SendSheet from './SendSheet';

const SendSheetWithData = withSendComponentWithData(SendSheet, {
  gasFormat: 'short',
  sendTransactionCallback: sendTransaction,
});

SendSheetWithData.navigationOptions = ({ navigation: { state: { params } } }) => ({
  effect: 'sheet',
  gestureResponseDistance: {
    vertical: params && params.verticalGestureResponseDistance,
  },
});

export default SendSheetWithData;
