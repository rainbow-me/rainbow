import PropTypes from 'prop-types';
import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { darkModeThemeColors, lightModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, InnerBorder } from '../layout';
import { position } from '@/styles';
import { useTheme } from '@/theme';
import ShadowStack from 'react-native-shadow-stack';

const AnimatedCenter = Animated.createAnimatedComponent(Centered);
const AnimatedShadowStack = Animated.createAnimatedComponent(ShadowStack);

const ApplePayButtonBorderRadius = 28;
const ApplePayButtonDimensions = {
  height: 56,
  width: '100%',
};

const ApplePayButton = ({ disabled, onDisabledPress, onSubmit }) => {
  const { isDarkMode: darkMode, colors } = useTheme();

  const darkModeOutputColors = [
    colors.alpha(darkModeThemeColors.grey20, 0.3),
    darkModeThemeColors.darkModeDark,
  ];

  const lightModeOutputColors = [
    lightModeThemeColors.blueGreyDark50,
    lightModeThemeColors.dark,
  ];

  const ApplePayButtonShadows = useMemo(() => {
    if (disabled) {
      return [
        [0, 10, 30, colors.shadow, 0.2],
        [0, 5, 15, colors.blueGreyDark50, darkMode ? 0 : 0.4],
      ];
    } else
      return [
        [0, 10, 30, colors.shadow, 0.2],
        [0, 5, 15, colors.shadow, 0.4],
      ];
  }, [colors.blueGreyDark50, colors.shadow, disabled, darkMode]);

  const disabledAnimation = useSharedValue(disabled ? 0 : 1);

  useLayoutEffect(() => {
    disabledAnimation.value = withTiming(disabled ? 0 : 1, {
      duration: 66,
      easing: Easing.out(Easing.ease),
    });
  }, [disabled, disabledAnimation]);

  const animatedProps = useAnimatedProps(() => {
    const outputColors = darkMode
      ? darkModeOutputColors
      : lightModeOutputColors;
    const backgroundColor = interpolateColor(
      disabledAnimation.value,
      [0, 1],
      outputColors
    );
    return {
      backgroundColor,
    };
  });

  const defaultStyle = useAnimatedStyle(() => ({
    opacity: disabledAnimation.value,
  }));

  const disabledStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      disabledAnimation.value,
      [0, 1],
      [1, 0],
      'extend'
    );
    return {
      opacity,
    };
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
          <AnimatedShadowStack
            {...position.coverAsObject}
            {...ApplePayButtonDimensions}
            backgroundColor={colors.white}
            borderRadius={ApplePayButtonBorderRadius}
            shadows={ApplePayButtonShadows}
            style={defaultStyle}
          />
          <AnimatedShadowStack
            {...position.coverAsObject}
            {...ApplePayButtonDimensions}
            backgroundColor={colors.white}
            borderRadius={ApplePayButtonBorderRadius}
            shadows={ApplePayButtonShadows}
            style={disabledStyle}
          />
        </Centered>
        <AnimatedCenter
          {...position.coverAsObject}
          {...ApplePayButtonDimensions}
          animatedProps={animatedProps}
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
