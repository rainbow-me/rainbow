import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Animated, Easing } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import stylePropType from 'react-style-proptype';

export default class SpinAnimation extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
    duration: PropTypes.number,
    style: stylePropType,
  };

  static defaultProps = {
    duration: 2000,
  };

  componentDidMount = () =>
    Animated.loop(
      Animated.timing(this.animatedValue, {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'duration' does not exist on type 'Readon... Remove this comment to see the full error message
        duration: this.props.duration,
        easing: Easing.linear,
        isInteraction: false,
        toValue: 1,
        useNativeDriver: true,
      })
    ).start();

  componentWillUnmount = () => this.animatedValue.stopAnimation();

  animatedValue = new Animated.Value(0);

  interpolatedAnimation = () =>
    this.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

  render = () => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'style' does not exist on type 'Readonly<... Remove this comment to see the full error message
    const { children, style } = this.props;

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Animated.View
        style={[
          style,
          { transform: [{ rotate: this.interpolatedAnimation() }] },
        ]}
      >
        {children}
      </Animated.View>
    );
  };
}
