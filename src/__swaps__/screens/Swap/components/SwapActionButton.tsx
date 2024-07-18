/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';
import { StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import Animated, {
  DerivedValue,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, Box, Column, Columns, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { GestureHandlerHoldButton } from './GestureHandlerHoldButton';
import { GestureHandlerV1Button } from './GestureHandlerV1Button';

function SwapButton({
  asset,
  borderRadius,
  disableShadow,
  icon,
  iconStyle,
  label,
  outline,
  rightIcon,
  small,
  disabled,
  opacity,
  children,
}: {
  asset: DerivedValue<ExtendedAnimatedAssetWithColors | null>;
  borderRadius?: number;
  disableShadow?: boolean;
  icon?: string | DerivedValue<string | undefined>;
  iconStyle?: StyleProp<TextStyle>;
  label: string | DerivedValue<string | undefined>;
  outline?: boolean;
  rightIcon?: string;
  small?: boolean;
  disabled?: DerivedValue<boolean | undefined>;
  opacity?: DerivedValue<number | undefined>;
  children?: React.ReactNode;
}) {
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
    <Animated.View style={buttonWrapperStyles}>
      <Box
        as={Animated.View}
        paddingHorizontal={{ custom: small ? 14 : 20 - (outline ? 2 : 0) }}
        paddingLeft={small && icon ? '10px' : undefined}
        paddingRight={small && rightIcon ? '10px' : undefined}
        style={[
          feedActionButtonStyles.button,
          outline && feedActionButtonStyles.outlineButton,
          {
            position: 'relative',
            overflow: 'hidden',
            height: '100%',
            borderRadius: buttonWrapperStyles.borderRadius,
          },
        ]}
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
        {children}
      </Box>
    </Animated.View>
  );
}

export const SwapActionButton = ({
  hugContent,
  onPressJS,
  onPressWorklet,
  scaleTo,
  style,
  disabled,
  type,
  ...props
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
  type?: DerivedValue<'tap' | 'hold' | undefined>;
}) => {
  const disabledWrapper = useAnimatedStyle(() => {
    return {
      pointerEvents: disabled && disabled?.value ? 'none' : 'auto',
    };
  });

  const holdProgress = useSharedValue(0);

  const holdProgressStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: globalColors.white50,
      height: '100%',
      width: `${holdProgress.value}%`,
    };
  });

  const [_type, setType] = useState<'tap' | 'hold'>('tap');
  useAnimatedReaction(
    () => type?.value,
    (current = 'tap') => {
      'worklet';
      runOnJS(setType)(current);
    }
  );

  if (_type === 'hold')
    return (
      <Animated.View style={disabledWrapper}>
        <GestureHandlerHoldButton
          onPressWorklet={onPressWorklet}
          onPressJS={onPressJS}
          style={[hugContent && feedActionButtonStyles.buttonWrapper, style]}
          holdProgress={holdProgress}
        >
          <SwapButton {...props} disabled={disabled}>
            <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, left: 0 }}>
              <Animated.View style={holdProgressStyle} />
            </View>
          </SwapButton>
        </GestureHandlerHoldButton>
      </Animated.View>
    );

  return (
    <Animated.View style={disabledWrapper}>
      <GestureHandlerV1Button
        onPressWorklet={onPressWorklet}
        onPressJS={onPressJS}
        scaleTo={scaleTo || (hugContent ? undefined : 0.925)}
        style={[hugContent && feedActionButtonStyles.buttonWrapper, style]}
      >
        <SwapButton {...props} disabled={disabled} />
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
