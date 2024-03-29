/* eslint-disable no-nested-ternary */
import c from 'chroma-js';
import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, TextStyle } from 'react-native';
import Animated, { SharedValue, useDerivedValue } from 'react-native-reanimated';

import { ButtonPressAnimation } from '@/components/animations';
import { AnimatedText, Box, Column, Columns, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { useTheme } from '@/theme';

export const SwapActionButton = ({
  color,
  borderRadius,
  disableShadow,
  hugContent,
  icon,
  iconStyle,
  label,
  onLongPress,
  onPress,
  outline,
  rightIcon,
  scaleTo,
  small,
}: {
  color?: string | Readonly<SharedValue<string | undefined>>;
  borderRadius?: number;
  disableShadow?: boolean;
  hugContent?: boolean;
  icon?: string | Readonly<SharedValue<string | undefined>>;
  iconStyle?: StyleProp<TextStyle>;
  label: string | Readonly<SharedValue<string | undefined>>;
  onLongPress?: () => void;
  onPress?: () => void;
  outline?: boolean;
  rightIcon?: string;
  scaleTo?: number;
  small?: boolean;
}) => {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const fallbackColor = useForegroundColor('blue');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const colorValue = typeof color === 'string' ? color : color?.value ?? fallbackColor;

  const textColor = useMemo(() => {
    if (!colorValue) return globalColors.white100;

    const contrastWithWhite = c.contrast(colorValue, globalColors.white100);
    if (contrastWithWhite < (isDarkMode ? 2.6 : 2)) {
      return globalColors.grey100;
    } else {
      return globalColors.white100;
    }
  }, [colorValue, isDarkMode]);

  const secondaryTextColor = useMemo(() => {
    if (!colorValue) return colors.alpha(globalColors.white100, 0.76);
    const contrastWithWhite = c.contrast(colorValue, globalColors.white100);

    if (contrastWithWhite < (isDarkMode ? 2.6 : 2)) {
      return colors.alpha(globalColors.grey100, 0.76);
    } else {
      return colors.alpha(globalColors.white100, isDarkMode ? 0.76 : 0.8);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorValue, isDarkMode]);

  return (
    <ButtonPressAnimation
      onLongPress={onLongPress}
      onPress={onPress}
      scaleTo={scaleTo || (hugContent ? undefined : 0.925)}
      style={hugContent && feedActionButtonStyles.buttonWrapper}
    >
      <Box
        as={Animated.View}
        paddingHorizontal={{ custom: small ? 14 : 20 - (outline ? 2 : 0) }}
        paddingLeft={small && icon ? '10px' : undefined}
        paddingRight={small && rightIcon ? '10px' : undefined}
        style={[
          feedActionButtonStyles.button,
          outline && feedActionButtonStyles.outlineButton,
          {
            backgroundColor: outline ? 'transparent' : colorValue || fallbackColor,
            borderColor: outline ? separatorSecondary : undefined,
            borderRadius: borderRadius ?? 24,
            height: small ? 36 : 48,
            shadowColor: disableShadow || outline ? 'transparent' : colorValue || fallbackColor,
            shadowOffset: {
              width: 0,
              height: isDarkMode ? 13 : small ? 6 : 10,
            },
            shadowOpacity: isDarkMode ? 0.2 : small ? 0.2 : 0.36,
            shadowRadius: isDarkMode ? 26 : small ? 9 : 15,
          },
        ]}
      >
        <Columns alignHorizontal="center" alignVertical="center" space="6px">
          {icon && (
            <Column width="content">
              {typeof icon === 'string' ? (
                <Text
                  align="center"
                  color={{ custom: outline ? colorValue || fallbackColor : textColor }}
                  size={small ? '15pt' : '17pt'}
                  weight="heavy"
                >
                  {icon}
                </Text>
              ) : (
                <AnimatedText
                  align="center"
                  color={{ custom: outline ? colorValue || fallbackColor : textColor }}
                  size={small ? '15pt' : '17pt'}
                  style={iconStyle}
                  text={icon}
                  weight="heavy"
                />
              )}
            </Column>
          )}
          {typeof label !== 'undefined' && (
            <Column width="content">
              {typeof label === 'string' ? (
                <Text
                  align="center"
                  color={{ custom: outline ? colorValue || fallbackColor : textColor }}
                  numberOfLines={1}
                  size={small ? '17pt' : '20pt'}
                  weight="heavy"
                >
                  {label}
                </Text>
              ) : (
                <AnimatedText
                  align="center"
                  color={{ custom: outline ? colorValue || fallbackColor : textColor }}
                  numberOfLines={1}
                  size={small ? '17pt' : '20pt'}
                  text={label}
                  weight="heavy"
                />
              )}
            </Column>
          )}
          {rightIcon && (
            <Column width="content">
              <Text
                align="center"
                color={{
                  custom: outline ? colors.alpha(colorValue || fallbackColor, 0.76) : secondaryTextColor,
                }}
                size={small ? '15pt' : '17pt'}
                weight="bold"
              >
                {rightIcon}
              </Text>
            </Column>
          )}
        </Columns>
      </Box>
    </ButtonPressAnimation>
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
