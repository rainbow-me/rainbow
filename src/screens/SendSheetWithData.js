import { compose, withHandlers, withProps } from 'recompact';
import {
  withContacts,
  withDataInit,
  withGas,
  withTransactionConfirmationScreen,
  withTransitionProps,
} from '../hoc';
import SendSheet from './SendSheet';

const SendSheetWithData = compose(
  withContacts,
  withDataInit,
  withGas,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withProps(({ transitionProps: { isTransitioning } }) => ({
    isTransitioning,
  })),
  withHandlers({
    fetchData: ({ refreshAccountData }) => async () => refreshAccountData(),
  })
)(SendSheet);

export default SendSheetWithData;
