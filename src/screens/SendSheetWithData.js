import { compose, withHandlers, withProps } from 'recompact';
import {
  withAccountData,
  withAccountSettings,
  withContacts,
  withDataInit,
  withGas,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniqueTokens,
} from '../hoc';
import SendSheet from './SendSheet';

const SendSheetWithData = compose(
  withAccountData,
  withAccountSettings,
  withContacts,
  withDataInit,
  withGas,
  withUniqueTokens,
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
