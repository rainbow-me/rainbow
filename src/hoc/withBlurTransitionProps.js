import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import Animated from 'react-native-reanimated';
import withTransitionProps from './withTransitionProps';
import { interpolate } from '../components/animations';

const transitionPropsSelector = state => state.transitionProps;

const interpolationConfig = {
  inputRange: [0, 1],
  outputRange: [0, 1],
};

const withBlurTransitionProps = ({
  isTransitioning,
  showingModal,
  position,
}) => ({
  blurIntensity:
    isTransitioning || showingModal
      ? interpolate(position, interpolationConfig)
      : new Animated.Value(0),
});

const withBlurTransitionPropsSelector = createSelector(
  [transitionPropsSelector],
  withBlurTransitionProps
);

export default compose(
  withTransitionProps,
  withProps(withBlurTransitionPropsSelector)
);
