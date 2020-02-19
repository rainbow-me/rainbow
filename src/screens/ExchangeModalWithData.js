import { get } from 'lodash';
import { compose, withProps } from 'recompact';
import {
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withBlockPolling,
  withGas,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniswapAllowances,
  withUniswapAssets,
} from '../hoc';
import ExchangeModal from './ExchangeModal';

const ExchangeModalWithData = compose(
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withGas,
  withBlockPolling,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniswapAllowances,
  withUniswapAssets,
  withProps(({ navigation, transitionProps: { isTransitioning } }) => ({
    isTransitioning,
    tabPosition: get(navigation, 'state.params.position'),
  }))
)(ExchangeModal);

export default ExchangeModalWithData;
