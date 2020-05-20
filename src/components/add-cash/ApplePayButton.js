import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import Animated, { Easing } from 'react-native-reanimated';
import { bInterpolateColor, useTimingTransition } from 'react-native-redash';
import ShadowStack from 'react-native-shadow-stack';
import { colors, position } from '../../styles';
import { ButtonPressAnimation, interpolate } from '../animations';
import { Icon } from '../icons';
import { Centered, InnerBorder } from '../layout';

const AnimatedCenter = Animated.createAnimatedComponent(Centered);
const AnimatedShadowStack = Animated.createAnimatedComponent(ShadowStack);

const ApplePayButtonBorderRadius = 28;
const ApplePayButtonDimensions = {
  height: 56,
  width: '100%',
};

const ApplePayButtonShadows = {
  default: [
    [0, 10, 30, colors.dark, 0.2],
    [0, 5, 15, colors.dark, 0.4],
  ],
  disabled: [
    [0, 10, 30, colors.dark, 0.2],
    [0, 5, 15, colors.blueGreyDark50, 0.4],
  ],
};

const ApplePayButtonShadowElement = ({ opacity, type }) => (
  <AnimatedShadowStack
    {...position.coverAsObject}
    {...ApplePayButtonDimensions}
    borderRadius={ApplePayButtonBorderRadius}
    shadows={ApplePayButtonShadows[type]}
    style={{ opacity }}
  />
);

const ApplePayButton = ({ disabled, onDisabledPress, onSubmit }) => {
  const disabledAnimation = useTimingTransition(!disabled, {
    duration: 66,
    ease: Easing.out(Easing.ease),
  });

  const backgroundColor = bInterpolateColor(
    disabledAnimation,
    colors.blueGreyDark50,
    colors.dark
  );

  const defaultShadowOpacity = interpolate(disabledAnimation, {
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const disabledShadowOpacity = interpolate(disabledAnimation, {
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const handlePress = useCallback(
    () => (disabled ? onDisabledPress() : onSubmit()),
    [disabled, onDisabledPress, onSubmit]
  );

  return (
    <ButtonPressAnimation
      hapticType={disabled ? 'notificationWarning' : 'selection'}
      onPress={handlePress}
      scaleTo={disabled ? 0.99 : 0.97}
      style={ApplePayButtonDimensions}
    >
      <Centered {...position.sizeAsObject('100%')}>
        <Centered {...position.sizeAsObject('100%')}>
          <ApplePayButtonShadowElement
            opacity={disabledShadowOpacity}
            type="disabled"
          />
          <ApplePayButtonShadowElement
            opacity={defaultShadowOpacity}
            type="default"
          />
        </Centered>
        <AnimatedCenter
          {...position.coverAsObject}
          {...ApplePayButtonDimensions}
          backgroundColor={backgroundColor}
          borderRadius={ApplePayButtonBorderRadius}
          zIndex={1}
        >
          <Centered {...position.sizeAsObject('100%')}>
            <Icon
              color={colors.white}
              flex={1}
              name="applePay"
              marginBottom={2}
            />
          </Centered>
          <InnerBorder radius={ApplePayButtonBorderRadius} />
        </AnimatedCenter>
      </Centered>
    </ButtonPressAnimation>
  );
};

ApplePayButton.propTypes = {
  disabled: PropTypes.bool,
  onDisabledPress: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default React.memo(ApplePayButton);
