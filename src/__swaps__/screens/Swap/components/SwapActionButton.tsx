/* eslint-disable no-nested-ternary */
import React from 'react';
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Animated, { DerivedValue, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { AnimatedText, Box, Column, Columns, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { GestureHandlerV1Button } from './GestureHandlerV1Button';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';

export const SwapActionButton = ({
  asset,
  borderRadius,
  disableShadow,
  hugContent,
  icon,
  iconStyle,
  label,
  onPressJS,
  onPressWorklet,
  outline,
  rightIcon,
  scaleTo,
  small,
  style,
  disabled,
  opacity,
}: {
  asset: DerivedValue<ExtendedAnimatedAssetWithColors | null>;
  borderRadius?: number;
  disableShadow?: boolean;
  hugContent?: boolean;
  icon?: string | DerivedValue<string | undefined>;
  iconStyle?: StyleProp<TextStyle>;
  label: string | DerivedValue<string | undefined>;
  onPressJS?: () => void;
  onPressWorklet?: () => void;
  outline?: boolean;
  rightIcon?: string;
  scaleTo?: number;
  small?: boolean;
  style?: ViewStyle;
  disabled?: DerivedValue<boolean | undefined>;
  opacity?: DerivedValue<number | undefined>;
}) => {
  const { isDarkMode } = useColorMode();
  const fallbackColor = useForegroundColor('label');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const textStyles = useAnimatedStyle(() => {
    return {
      color: asset.value ? getColorValueForThemeWorklet(asset.value?.textColor, isDarkMode) : globalColors.white100,
    };
  });

  const secondaryTextStyles = useAnimatedStyle(() => {
    const secondaryColor = getColorValueForThemeWorklet(asset.value?.textColor, isDarkMode, true);

    let opacity = isDarkMode ? 0.76 : 0.8;
    if (secondaryColor === globalColors.grey100) {
      opacity = 0.76;
    }

    return {
      opacity,
    };
  });

  const buttonWrapperStyles = useAnimatedStyle(() => {
    return {
      backgroundColor: outline
        ? 'transparent'
        : getColorValueForThemeWorklet(asset.value?.highContrastColor, isDarkMode, true) || fallbackColor,
      borderColor: outline ? separatorSecondary : undefined,
      borderRadius: borderRadius ?? 24,
      height: small ? 36 : 48,
      shadowColor:
        disableShadow || outline
          ? 'transparent'
          : getColorValueForThemeWorklet(asset.value?.highContrastColor, isDarkMode) || fallbackColor,
      shadowOffset: {
        width: 0,
        height: isDarkMode ? 13 : small ? 6 : 10,
      },
      shadowOpacity: isDarkMode ? 0.2 : small ? 0.2 : 0.36,
      shadowRadius: isDarkMode ? 26 : small ? 9 : 15,
      opacity: withTiming(opacity?.value ?? (disabled?.value ? 0.6 : 1), TIMING_CONFIGS.slowerFadeConfig),
    };
  });

  const disabledWrapper = useAnimatedStyle(() => {
    return {
      pointerEvents: disabled && disabled?.value ? 'none' : 'auto',
    };
  });

  const iconValue = useDerivedValue(() => {
    if (typeof icon === 'string') return icon;
    return icon?.value || '';
  });

  const labelValue = useDerivedValue(() => {
    if (typeof label === 'string') return label;
    return label?.value || '';
  });

  const rightIconValue = useDerivedValue(() => {
    return rightIcon;
  });

  return (
    <Animated.View style={disabledWrapper}>
      <GestureHandlerV1Button
        onPressWorklet={onPressWorklet}
        onPressJS={onPressJS}
        scaleTo={scaleTo || (hugContent ? undefined : 0.925)}
        style={[hugContent && feedActionButtonStyles.buttonWrapper, style]}
      >
        <Box
          as={Animated.View}
          paddingHorizontal={{ custom: small ? 14 : 20 - (outline ? 2 : 0) }}
          paddingLeft={small && icon ? '10px' : undefined}
          paddingRight={small && rightIcon ? '10px' : undefined}
          style={[feedActionButtonStyles.button, outline && feedActionButtonStyles.outlineButton, buttonWrapperStyles]}
        >
          <Columns alignHorizontal="center" alignVertical="center" space="6px">
            {icon && (
              <Column width="content">
                <AnimatedText align="center" size={small ? '15pt' : '17pt'} style={[iconStyle, textStyles]} weight="heavy">
                  {iconValue}
                </AnimatedText>
              </Column>
            )}
            {typeof label !== 'undefined' && (
              <Column width="content">
                <AnimatedText align="center" style={textStyles} numberOfLines={1} size={small ? '17pt' : '20pt'} weight="heavy">
                  {labelValue}
                </AnimatedText>
              </Column>
            )}
            {rightIcon && (
              <Column width="content">
                <AnimatedText align="center" style={[textStyles, secondaryTextStyles]} size={small ? '15pt' : '17pt'} weight="bold">
                  {rightIconValue}
                </AnimatedText>
              </Column>
            )}
          </Columns>
        </Box>
      </GestureHandlerV1Button>
    </Animated.View>
  );
};

const feedActionButtonStyles = StyleSheet.create({
  button: {
    alignContent: 'center',
    borderCurve: 'continuous',
    justifyContent: 'center',
  },
  buttonWrapper: {
    alignSelf: 'center',
  },
  outlineButton: {
    borderWidth: 2,
  },
});
