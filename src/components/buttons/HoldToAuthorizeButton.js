import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
  LongPressGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import RadialGradient from 'react-native-radial-gradient';
import Animated, { Easing } from 'react-native-reanimated';
import { withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding, position } from '../../styles';
import { deviceUtils } from '../../utils';
import { ScaleInAnimation } from '../animations';
import { BiometryIcon, Icon } from '../icons';
import InnerBorder from '../InnerBorder';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { Text } from '../text';

const {
  cond,
  divide,
  greaterThan,
  multiply,
  sub,
  timing,
  Value,
  View,
} = Animated;

const ButtonBorderRadius = 30;
const ButtonHeight = 59;
const ButtonShadows = {
  default: [
    [0, 3, 5, colors.dark, 0.2],
    [0, 6, 10, colors.dark, 0.14],
    [0, 1, 18, colors.dark, 0.12],
  ],
  disabled: [
    [0, 2, 6, colors.dark, 0.06],
    [0, 3, 9, colors.dark, 0.08],
  ],
};

const progressDurationMs = 500; // @christian approves

const Content = styled(Centered)`
  ${padding(15)}
  border-radius: ${ButtonBorderRadius};
  flex-grow: 0;
  height: ${ButtonHeight};
  overflow: hidden;
  width: 100%;
`;

const IconContainer = styled(Centered)`
  ${position.size(34)}
  left: 19;
  margin-bottom: 2;
  position: absolute;
`;

const Title = withProps({
  color: 'white',
  size: 'large',
  style: { marginBottom: 2 },
  weight: 'semibold',
})(Text);

const GradientColors = {
  default: {
    from: colors.primaryBlue,
    to: '#006FFF',
  },
  disabled: {
    from: colors.grey,
    to: colors.grey,
  },
};

const buildAnimation = (value, options) => {
  const {
    duration = 150,
    isInteraction = false,
    toValue,
  } = options;

  return timing(value, {
    duration,
    easing: Easing.inOut(Easing.ease),
    isInteraction,
    toValue,
    useNativeDriver: true,
  });
};

const calculateReverseDuration = progess => multiply(divide(progess, 100), progressDurationMs);

const HoldToAuthorizeButtonIcon = ({ animatedValue, isAuthorizing }) => {
  const isSpinnerVisible = greaterThan(animatedValue, 0);
  const spinnerIn = sub(22, animatedValue);
  const spinnerOut = divide(1, animatedValue);

  return (
    <IconContainer>
      <ScaleInAnimation value={animatedValue}>
        <BiometryIcon />
      </ScaleInAnimation>
      <ScaleInAnimation
        scaleTo={0.001}
        value={cond(isSpinnerVisible, spinnerIn, spinnerOut)}
      >
        <Icon name="progress" progress={animatedValue} />
      </ScaleInAnimation>
    </IconContainer>
  );
};

HoldToAuthorizeButtonIcon.propTypes = {
  animatedValue: PropTypes.object,
  isAuthorizing: PropTypes.bool,
};

export default class HoldToAuthorizeButton extends PureComponent {
  static propTypes = {
    children: PropTypes.any,
    disabled: PropTypes.bool,
    isAuthorizing: PropTypes.bool,
    onLongPress: PropTypes.func.isRequired,
    style: PropTypes.object,
  }

  static defaultProps = {
    disabled: false,
  }

  state = {
    isAuthorizing: false,
  }

  animation = new Value(0)

  progress = new Value(0)

  scale = new Value(1)

  tapHandlerState = 1

  componentDidUpdate = () => {
    if (this.state.isAuthorizing && !this.props.isAuthorizing) {
      this.setState({ isAuthorizing: false });
    }
  }

  onTapChange = ({ nativeEvent }) => {
    const { disabled } = this.props;

    this.tapHandlerState = nativeEvent.state;

    if (nativeEvent.state === State.BEGAN) {
      if (disabled) {
        ReactNativeHapticFeedback.trigger('notificationWarning');
        buildAnimation(this.scale, { toValue: 0.99 }).start(() => {
          buildAnimation(this.scale, { toValue: 1 }).start();
        });
      } else {
        buildAnimation(this.scale, { toValue: 0.97 }).start();
        buildAnimation(this.animation, {
          duration: progressDurationMs,
          toValue: 100,
        }).start();
      }
    } else if (!disabled && nativeEvent.state === State.END) {
      buildAnimation(this.scale, { toValue: 1 }).start();
      buildAnimation(this.animation, {
        duration: calculateReverseDuration(this.animation),
        isInteraction: true,
        toValue: 0,
      }).start();
    }
  }

  onLongPressChange = ({ nativeEvent }) => {
    const { disabled, onLongPress } = this.props;

    if (!disabled && nativeEvent.state === State.ACTIVE) {
      ReactNativeHapticFeedback.trigger('notificationSuccess');

      buildAnimation(this.scale, {
        isInteraction: true,
        toValue: 1,
      }).start(() => this.setState({ isAuthorizing: true }));

      if (onLongPress) {
        onLongPress();
      }
    }
  }

  render() {
    const {
      children,
      disabled,
      style,
      ...props
    } = this.props;

    const theme = disabled ? 'disabled' : 'default';

    return (
      <TapGestureHandler onHandlerStateChange={this.onTapChange}>
        <LongPressGestureHandler
          minDurationMs={progressDurationMs}
          onHandlerStateChange={this.onLongPressChange}
        >
          <View {...props} style={[style, { transform: [{ scale: this.scale }] }]}>
            <ShadowStack
              borderRadius={ButtonBorderRadius}
              height={ButtonHeight}
              shadows={ButtonShadows[theme]}
              shouldRasterizeIOS
              width={'100%'}
            >
              <Content>
                <RadialGradient
                  center={[0, (ButtonHeight / 2)]}
                  colors={[GradientColors[theme].from, GradientColors[theme].to]}
                  css={position.cover}
                  pointerEvents="none"
                  radius={deviceUtils.dimensions.width - 30}
                />
                <HoldToAuthorizeButtonIcon
                  animatedValue={this.animation}
                  isAuthorizing={this.state.isAuthorizing}
                />
                <Title>
                  {this.state.isAuthorizing
                    ? 'Authorizing'
                    : children
                  }
                </Title>
                <InnerBorder radius={ButtonBorderRadius} />
              </Content>
            </ShadowStack>
          </View>
        </LongPressGestureHandler>
      </TapGestureHandler>
    );
  }
}
