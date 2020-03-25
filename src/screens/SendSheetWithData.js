import { compose, withProps } from 'recompact';
import {
  withContacts,
  withGas,
  withTransactionConfirmationScreen,
  withTransitionProps,
} from '../hoc';
import SendSheet from './SendSheet';

const SendSheetWithData = compose(
  withContacts,
  withGas,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withProps(({ transitionProps: { isTransitioning } }) => ({
    isTransitioning,
  }))
)(SendSheet);

export default SendSheetWithData;
