/* eslint-disable no-nested-ternary */
import c from 'chroma-js';
import React from 'react';
import { StyleProp, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  DerivedValue,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import { ButtonPressAnimation } from '@/components/animations';
import { AnimatedText, Box, Column, Columns, globalColors, useColorMode, useForegroundColor } from '@/design-system';

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
  color?: DerivedValue<string | undefined>;
  borderRadius?: number;
  disableShadow?: boolean;
  hugContent?: boolean;
  icon?: string | DerivedValue<string | undefined>;
  iconStyle?: StyleProp<TextStyle>;
  label: string | DerivedValue<string | undefined>;
  onLongPress?: () => void;
  onPress?: () => void;
  outline?: boolean;
  rightIcon?: string;
  scaleTo?: number;
  small?: boolean;
}) => {
  const { isDarkMode } = useColorMode();
  const fallbackColor = useForegroundColor('blue');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const textColorValue = useSharedValue(globalColors.white100);

  const textColor = (color: string) => {
    const contrastWithWhite = c.contrast(color || fallbackColor, globalColors.white100);
    if (contrastWithWhite < (isDarkMode ? 2.6 : 2)) {
      textColorValue.value = globalColors.grey100;
    } else {
      textColorValue.value = globalColors.white100;
    }
  };

  useAnimatedReaction(
    () => color?.value,
    (current, previous) => {
      if (previous && current !== previous && current !== undefined) {
        runOnJS(textColor)(current);
      }
    }
  );

  const textStyles = useAnimatedStyle(() => {
    return {
      color: textColorValue.value,
    };
  });

  const secondaryTextStyles = useAnimatedStyle(() => {
    let opacity = isDarkMode ? 0.76 : 0.8;
    if (textColorValue.value === globalColors.grey100) {
      opacity = 0.76;
    }

    return {
      opacity,
    };
  });

  const buttonWrapperStyles = useAnimatedStyle(() => {
    return {
      backgroundColor: outline ? 'transparent' : color?.value || fallbackColor,
      borderColor: outline ? separatorSecondary : undefined,
      borderRadius: borderRadius ?? 24,
      height: small ? 36 : 48,
      shadowColor: disableShadow || outline ? 'transparent' : color?.value || fallbackColor,
      shadowOffset: {
        width: 0,
        height: isDarkMode ? 13 : small ? 6 : 10,
      },
      shadowOpacity: isDarkMode ? 0.2 : small ? 0.2 : 0.36,
      shadowRadius: isDarkMode ? 26 : small ? 9 : 15,
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
        style={[feedActionButtonStyles.button, outline && feedActionButtonStyles.outlineButton, buttonWrapperStyles]}
      >
        <Columns alignHorizontal="center" alignVertical="center" space="6px">
          {icon && (
            <Column width="content">
              <AnimatedText align="center" size={small ? '15pt' : '17pt'} style={[iconStyle, textStyles]} text={iconValue} weight="heavy" />
            </Column>
          )}
          {typeof label !== 'undefined' && (
            <Column width="content">
              <AnimatedText
                align="center"
                style={textStyles}
                numberOfLines={1}
                size={small ? '17pt' : '20pt'}
                text={labelValue}
                weight="heavy"
              />
            </Column>
          )}
          {rightIcon && (
            <Column width="content">
              <AnimatedText
                align="center"
                style={[textStyles, secondaryTextStyles]}
                size={small ? '15pt' : '17pt'}
                text={rightIconValue}
                weight="bold"
              />
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
