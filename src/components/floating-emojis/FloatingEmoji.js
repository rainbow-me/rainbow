import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Animated, { Easing } from 'react-native-reanimated';
import stylePropType from 'react-style-proptype';
import { colors, fonts } from '../../styles';
import { Emoji } from '../text';

const {
  concat,
  interpolate,
  timing,
  Value,
} = Animated;

export default class FloatingEmoji extends PureComponent {
  static propTypes = {
    distance: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
    emoji: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    onComplete: PropTypes.func.isRequired,
    right: PropTypes.string.isRequired,
    size: PropTypes.string.isRequired,
    style: stylePropType,
    top: PropTypes.number,
  }

  static defaultProps = {
    distance: 100,
    duration: 2000,
    emoji: '+1',
    right: 0,
  }

  position = new Value(0)

  componentDidMount() {
    const animationConfig = {
      duration: this.props.duration,
      easing: Easing.elastic(),
      toValue: this.props.distance * -1,
    };

    timing(this.position, animationConfig).start(this.handleAnimationComplete);
  }

  handleAnimationComplete = () => this.props.onComplete(this.props.id)

  render() {
    const {
      emoji,
      right,
      size,
      style,
      top,
    } = this.props;

    const distance = Math.ceil(this.props.distance);
    const negativeHeight = distance * -1;

    const sizeAsNumber = parseFloat(fonts.size[size]);

    this.yAnimation = interpolate(this.position, {
      inputRange: [negativeHeight, 0],
      outputRange: [distance, 0],
    });

    this.opacityAnimation = interpolate(this.yAnimation, {
      inputRange: [0, distance / 2, distance - sizeAsNumber],
      outputRange: [1, 0.89, 0],
    });

    this.rotateAnimation = interpolate(this.yAnimation, {
      inputRange: [0, distance / 4, distance / 3, distance / 2, distance],
      outputRange: [0, -2, 0, 2, 0],
    });

    this.scaleAnimation = interpolate(this.yAnimation, {
      inputRange: [0, 15, 30, 50, distance],
      outputRange: [0, 1.2, 1.1, 1, 1],
    });

    this.xAnimation = interpolate(this.yAnimation, {
      inputRange: [0, distance / 2, distance],
      outputRange: [0, 15, 0],
    });

    return (
      <Animated.View
        style={{
          ...style,
          backgroundColor: colors.transparent,
          opacity: this.opacityAnimation,
          position: 'absolute',
          right,
          top: top || sizeAsNumber * -0.5,
          transform: [
            { rotate: concat(this.rotateAnimation, 'deg') },
            { scale: this.scaleAnimation },
            { translateX: this.xAnimation },
            { translateY: this.position },
          ],
        }}
      >
        <Emoji name={emoji} size={size} />
      </Animated.View>
    );
  }
}
