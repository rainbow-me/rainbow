import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import Animated from 'react-native-reanimated';
import withTransitionProps from './withTransitionProps';

const { interpolate, Value } = Animated;

const stackTransitionPropsSelector = state => state.stackTransitionProps;

const withBlurTransitionProps = ({ effect, isTransitioning, position }) => {
  const blurOpacity = position.interpolate(blurOpacityInterpolation);

  return {
    blurOpacity,
    showBlur: (effect === 'expanded') && (isTransitioning || blurOpacity.__getValue() > 0),
  };
};

const withBlurTransitionPropsSelector = createSelector(
  [stackTransitionPropsSelector],
  withBlurTransitionProps
);

export default Component =>
  compose(
    withTransitionProps,
    withProps(withBlurTransitionPropsSelector)
  )(Component);
