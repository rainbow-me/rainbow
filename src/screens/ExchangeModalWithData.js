import { get } from 'lodash';
import { withNavigation } from 'react-navigation';
import { compose, withProps } from 'recompact';
import { withBlockedHorizontalSwipe, withTransitionProps } from '../hoc';
import ExchangeModal from './ExchangeModal';

const ExchangeModalWithData = compose(
  withBlockedHorizontalSwipe,
  withNavigation,
  withTransitionProps,
  withProps(({ navigation, transitionProps: { isTransitioning } }) => ({
    isTransitioning,
    tabPosition: get(navigation, 'state.params.position'),
  }))
)(ExchangeModal);

export default ExchangeModalWithData;
