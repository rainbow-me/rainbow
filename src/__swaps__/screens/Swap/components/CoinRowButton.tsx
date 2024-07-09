/* eslint-disable no-nested-ternary */
import React from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';

export const CoinRowButton = ({
  color,
  icon,
  onPress,
  outline,
  size,
  weight,
  disabled,
}: {
  color?: string;
  icon: string;
  onPress?: () => void;
  outline?: boolean;
  size?: TextSize;
  weight?: TextWeight;
  disabled?: boolean;
}) => {
  const { isDarkMode } = useColorMode();
  const fillTertiary = useForegroundColor('fillTertiary');
  const fillQuaternary = useForegroundColor('fillQuaternary');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  return (
    <ButtonPressAnimation disallowInterruption onPress={onPress} scaleTo={0.8} disabled={disabled}>
      <Box
        alignItems="center"
        borderRadius={14}
        height={{ custom: 28 }}
        justifyContent="center"
        style={{
          backgroundColor: outline
            ? 'transparent'
            : color
              ? opacity(color, isDarkMode ? 0.16 : 0.25)
              : isDarkMode
                ? fillQuaternary
                : opacity(fillTertiary, 0.04),
          borderColor: outline ? (isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR) : color ? opacity(color, 0.1) : separatorTertiary,
          borderWidth: THICK_BORDER_WIDTH,
        }}
        width={{ custom: 28 }}
      >
        <TextIcon
          color={color ? { custom: color } : 'labelQuaternary'}
          containerSize={28}
          opacity={isDarkMode ? 1 : 0.75}
          size={size || 'icon 12px'}
          weight={weight || 'heavy'}
        >
          {icon}
        </TextIcon>
      </Box>
    </ButtonPressAnimation>
  );
};
