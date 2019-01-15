import { withSendComponentWithData } from 'balance-common';
import SendSheet from './SendSheet';
import { sendTransaction } from '../model/wallet';

const SendSheetWithData = withSendComponentWithData(SendSheet, {
  gasFormat: 'short',
  sendTransactionCallback: sendTransaction,
});

SendSheetWithData.navigationOptions = ({ navigation }) => {
  const { params } = navigation.state;

  return {
    effect: 'sheet',
    gestureResponseDistance: {
      vertical: params && params.verticalGestureResponseDistance,
    },
  };
};

export default SendSheetWithData;
