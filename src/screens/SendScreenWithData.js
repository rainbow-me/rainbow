import { withSendComponentWithData } from 'balance-common';
import SendScreen from './SendScreen';
import { sendTransaction } from '../model/wallet';

export default withSendComponentWithData(SendScreen, sendTransaction);
