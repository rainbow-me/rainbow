/* eslint-disable no-nested-ternary */
import chroma from 'chroma-js';
import React, { useState } from 'react';
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Animated, {
  DerivedValue,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, Box, Column, Columns, Cover, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { GestureHandlerButton, GestureHandlerButtonProps } from './GestureHandlerButton';
import { useSwapContext } from '../providers/swap-provider';
import { SharedOrDerivedValueText } from '@/design-system/components/Text/AnimatedText';

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
  testID,
}: {
  asset: DerivedValue<ExtendedAnimatedAssetWithColors | null>;
  borderRadius?: number;
  disableShadow?: boolean;
  icon?: string | SharedOrDerivedValueText;
  iconStyle?: StyleProp<TextStyle>;
  label: string | SharedOrDerivedValueText;
  outline?: boolean;
  rightIcon?: string;
  small?: boolean;
  disabled?: DerivedValue<boolean | undefined>;
  opacity?: DerivedValue<number | undefined>;
  children?: React.ReactNode;
  testID?: string;
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
    const secondaryColor = getColorValueForThemeWorklet(asset.value?.textColor, isDarkMode);

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
      backgroundColor: outline ? 'transparent' : getColorValueForThemeWorklet(asset.value?.highContrastColor, isDarkMode) || fallbackColor,
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
        testID={testID}
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
        {children}
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
              <AnimatedText
                testID={`${testID}-text`}
                align="center"
                style={textStyles}
                numberOfLines={1}
                size={small ? '17pt' : '20pt'}
                weight="heavy"
              >
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
    </Animated.View>
  );
}

const HoldProgress = ({ holdProgress }: { holdProgress: SharedValue<number> }) => {
  const { isDarkMode } = useColorMode();
  const { internalSelectedOutputAsset } = useSwapContext();

  const [brightenedColor, setBrightenedColor] = useState<string>(
    transformColor(getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.highContrastColor, isDarkMode), false)
  );

  const holdProgressStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(holdProgress?.value, [0, 4, 20, 96, 100], [0, 0, 1, 1, 0], 'clamp'),
      width: `${holdProgress?.value ?? 0}%`,
    };
  });

  function transformColor(assetColor: string, shouldSetColor = true) {
    const newColor = chroma(assetColor)
      .saturate(isDarkMode ? 0.15 : 0.1)
      .brighten(isDarkMode ? 0.5 : 0.3)
      .css();
    if (shouldSetColor) setBrightenedColor(newColor);
    return newColor;
  }

  useAnimatedReaction(
    () => internalSelectedOutputAsset.value?.highContrastColor,
    (current, previous) => {
      if (current && current !== previous) {
        runOnJS(transformColor)(getColorValueForThemeWorklet(current, isDarkMode));
      }
    },
    []
  );

  return (
    <Cover style={{ borderRadius: 100, overflow: 'hidden' }}>
      <Animated.View
        style={[
          holdProgressStyle,
          {
            backgroundColor: brightenedColor,
            height: '100%',
            ...(IS_IOS
              ? {
                  shadowColor: brightenedColor,
                  shadowOffset: {
                    width: 12,
                    height: 0,
                  },
                  shadowOpacity: 1,
                  shadowRadius: 6,
                }
              : {}),
          },
        ]}
      />
    </Cover>
  );
};

export const SwapActionButton = ({
  holdProgress,
  hugContent,
  longPressDuration,
  onLongPressEndWorklet,
  onLongPressWorklet,
  onPressJS,
  onPressStartWorklet,
  onPressWorklet,
  scaleTo,
  style,
  disabled,
  testID,
  ...props
}: {
  asset: DerivedValue<ExtendedAnimatedAssetWithColors | null>;
  borderRadius?: number;
  disableShadow?: boolean;
  holdProgress?: SharedValue<number>;
  hugContent?: boolean;
  icon?: string | SharedOrDerivedValueText;
  iconStyle?: StyleProp<TextStyle>;
  label: string | SharedOrDerivedValueText;
  longPressDuration?: GestureHandlerButtonProps['longPressDuration'];
  onLongPressEndWorklet?: GestureHandlerButtonProps['onLongPressEndWorklet'];
  onLongPressWorklet?: GestureHandlerButtonProps['onLongPressWorklet'];
  onPressJS?: GestureHandlerButtonProps['onPressJS'];
  onPressStartWorklet?: GestureHandlerButtonProps['onPressStartWorklet'];
  onPressWorklet?: GestureHandlerButtonProps['onPressWorklet'];
  outline?: boolean;
  rightIcon?: string;
  scaleTo?: number;
  small?: boolean;
  style?: ViewStyle;
  disabled?: DerivedValue<boolean | undefined>;
  opacity?: DerivedValue<number | undefined>;
  testID?: string;
}) => {
  const disabledWrapper = useAnimatedStyle(() => {
    return {
      pointerEvents: disabled && disabled?.value ? 'none' : 'auto',
    };
  });

  return (
    <Animated.View style={disabledWrapper}>
      <GestureHandlerButton
        longPressDuration={longPressDuration}
        onLongPressEndWorklet={onLongPressEndWorklet}
        onLongPressWorklet={onLongPressWorklet}
        onPressJS={onPressJS}
        onPressStartWorklet={onPressStartWorklet}
        onPressWorklet={onPressWorklet}
        scaleTo={scaleTo || (hugContent ? undefined : 0.925)}
        style={[hugContent && feedActionButtonStyles.buttonWrapper, style]}
      >
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <SwapButton {...props} disabled={disabled} testID={testID}>
          {holdProgress && <HoldProgress holdProgress={holdProgress} />}
        </SwapButton>
      </GestureHandlerButton>
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
