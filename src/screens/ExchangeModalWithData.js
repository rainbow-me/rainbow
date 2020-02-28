import { get } from 'lodash';
import { compose, withProps } from 'recompact';
import {
  withBlockedHorizontalSwipe,
  withBlockPolling,
  withGas,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniswapAllowances,
} from '../hoc';
import ExchangeModal from './ExchangeModal';

const ExchangeModalWithData = compose(
  withBlockedHorizontalSwipe,
  withGas,
  withBlockPolling,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniswapAllowances,
  withProps(({ navigation, transitionProps: { isTransitioning } }) => ({
    isTransitioning,
    tabPosition: get(navigation, 'state.params.position'),
  }))
)(ExchangeModal);

export default ExchangeModalWithData;
