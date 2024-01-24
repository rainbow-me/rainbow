import c from 'chroma-js';
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { ButtonPressAnimation } from '@/components/animations';
import {
  Box,
  Inline,
  Text,
  globalColors,
  useForegroundColor,
} from '@/design-system';
import { useTheme } from '@/theme';

export const SwapActionButton = ({
  color,
  borderRadius,
  disableShadow,
  hugContent,
  icon,
  label,
  onLongPress,
  onPress,
  outline,
  rightIcon,
  scaleTo,
  small,
}: {
  color?: string;
  borderRadius?: number;
  disableShadow?: boolean;
  hugContent?: boolean;
  icon?: string;
  label: string;
  onLongPress?: () => void;
  onPress?: () => void;
  outline?: boolean;
  rightIcon?: string;
  scaleTo?: number;
  small?: boolean;
}) => {
  const { colors } = useTheme();

  const fallbackColor = useForegroundColor('blue');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const textColor = useMemo(() => {
    if (!color) return globalColors.white100;
    const contrastWithWhite = c.contrast(color, globalColors.white100);

    if (contrastWithWhite < 2.5) {
      return globalColors.grey100;
    } else {
      return globalColors.white100;
    }
  }, [color]);

  const secondaryTextColor = useMemo(() => {
    if (!color) return colors.alpha(globalColors.white100, 0.76);
    const contrastWithWhite = c.contrast(color, globalColors.white100);

    if (contrastWithWhite < 2.5) {
      return colors.alpha(globalColors.grey100, 0.76);
    } else {
      return colors.alpha(globalColors.white100, 0.76);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  return (
    <ButtonPressAnimation
      onLongPress={onLongPress}
      onPress={onPress}
      scaleTo={scaleTo || (hugContent ? undefined : 0.94)}
      style={hugContent && feedActionButtonStyles.buttonWrapper}
    >
      <Box
        paddingHorizontal={{ custom: small ? 14 : 20 - (outline ? 2 : 0) }}
        paddingLeft={small && icon ? '10px' : undefined}
        paddingRight={small && rightIcon ? '10px' : undefined}
        style={[
          feedActionButtonStyles.button,
          outline && feedActionButtonStyles.outlineButton,
          {
            backgroundColor: outline ? 'transparent' : color || fallbackColor,
            borderColor: outline ? separatorSecondary : undefined,
            borderRadius: borderRadius ?? 24,
            height: small ? 36 : 48,
            shadowColor:
              disableShadow || outline ? 'transparent' : color || fallbackColor,
            shadowOpacity: 0.2,
          },
        ]}
      >
        <Inline
          alignHorizontal="center"
          alignVertical="center"
          space="6px"
          wrap={false}
        >
          {icon && (
            <Text
              align="center"
              color={{ custom: outline ? color || fallbackColor : textColor }}
              size={small ? '15pt' : '17pt'}
              weight="heavy"
            >
              {icon}
            </Text>
          )}
          <Text
            align="center"
            color={{ custom: outline ? color || fallbackColor : textColor }}
            numberOfLines={1}
            size={small ? '17pt' : '20pt'}
            weight="heavy"
          >
            {label}
          </Text>
          {rightIcon && (
            <Text
              align="center"
              color={{
                custom: outline
                  ? colors.alpha(color || fallbackColor, 0.76)
                  : secondaryTextColor,
              }}
              size={small ? '15pt' : '17pt'}
              weight="bold"
            >
              {rightIcon}
            </Text>
          )}
        </Inline>
      </Box>
    </ButtonPressAnimation>
  );
};

const feedActionButtonStyles = StyleSheet.create({
  button: {
    alignContent: 'center',
    borderCurve: 'continuous',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 13 },
    shadowRadius: 26,
  },
  buttonWrapper: {
    alignSelf: 'center',
  },
  outlineButton: {
    borderWidth: 2,
  },
});
