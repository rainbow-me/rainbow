import { withSendComponentWithData } from 'balance-common';
import SendScreen from './SendScreen';
import { sendTransaction } from '../model/wallet';

const SendScreenWithData = withSendComponentWithData(SendScreen, {
  gasFormat: 'short',
  sendTransactionCallback: sendTransaction,
});

SendScreenWithData.navigationOptions = ({ navigation }) => {
  const { params } = navigation.state;

  return {
    effect: 'sheet',
    gestureResponseDistance: {
      vertical: params && params.verticalGestureResponseDistance,
    },
  };
};

export default SendScreenWithData;
