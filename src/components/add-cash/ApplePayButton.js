import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import Animated, { Easing } from 'react-native-reanimated';
import { mixColor, useTimingTransition } from 'react-native-redash';
import { useTheme } from '../../context/ThemeContext';

import { ButtonPressAnimation, interpolate } from '../animations';
import { Icon } from '../icons';
import { Centered, InnerBorder } from '../layout';
import { colors, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const AnimatedCenter = Animated.createAnimatedComponent(Centered);
const AnimatedShadowStack = Animated.createAnimatedComponent(ShadowStack);

const ApplePayButtonBorderRadius = 28;
const ApplePayButtonDimensions = {
  height: 56,
  width: '100%',
};

const ApplePayButtonShadows = darkMode => ({
  default: [
    [0, 10, 30, colors.shadow, 0.2],
    [0, 5, 15, colors.shadow, 0.4],
  ],
  disabled: [
    [0, 10, 30, colors.shadow, 0.2],
    [0, 5, 15, colors.blueGreyDark50, darkMode ? 0 : 0.4],
  ],
});

const shadowsDark = ApplePayButtonShadows(true);
const shadowsLight = ApplePayButtonShadows(false);

const ApplePayButtonShadowElement = ({ opacity, type, darkMode }) => (
  <AnimatedShadowStack
    {...position.coverAsObject}
    {...ApplePayButtonDimensions}
    backgroundColor={colors.white}
    borderRadius={ApplePayButtonBorderRadius}
    shadows={(darkMode ? shadowsDark : shadowsLight)[type]}
    style={{ opacity }}
  />
);

const ApplePayButton = ({ disabled, onDisabledPress, onSubmit }) => {
  const { isDarkMode: darkMode } = useTheme();

  const disabledAnimation = useTimingTransition(!disabled, {
    duration: 66,
    ease: Easing.out(Easing.ease),
  });

  const backgroundColor = mixColor(
    disabledAnimation,
    darkMode ? colors.alpha(colors.grey20, 0.3) : colors.blueGreyDark50,
    darkMode ? colors.darkModeColors.darkModeDark : colors.dark
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
            darkMode={darkMode}
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
              color={
                darkMode && disabled
                  ? colors.alpha(colors.blueGreyDark, 0.4)
                  : colors.whiteLabel
              }
              flex={1}
              marginBottom={2}
              name="applePay"
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
