import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import withTransitionProps from './withTransitionProps';

const blurOpacityInterpolation = {
  inputRange: [0, 0.01, 1],
  outputRange: [0, 1, 1],
};

const stackTransitionPropsSelector = state => state.stackTransitionProps;

const withBlurTransitionProps = ({
  blurColor,
  effect,
  isTransitioning,
  position,
}) => {
  const blurOpacity = position.interpolate(blurOpacityInterpolation);

  return {
    blurColor,
    blurOpacity,
    showBlur: (effect === 'expanded') && (isTransitioning || blurOpacity.__getValue() > 0),
  };
};

const withBlurTransitionPropsSelector = createSelector(
  [stackTransitionPropsSelector],
  withBlurTransitionProps,
);

export default Component => compose(
  withTransitionProps,
  withProps(withBlurTransitionPropsSelector),
)(Component);
