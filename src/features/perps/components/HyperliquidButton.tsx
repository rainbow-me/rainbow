import React, { ComponentProps, ReactNode } from 'react';
import { Box, BoxProps, useColorMode } from '@/design-system';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import LinearGradient from 'react-native-linear-gradient';
import { HYPERLIQUID_COLORS } from '@/features/perps/constants';
import { StyleSheet, View } from 'react-native';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';

type ButtonPressAnimationProps = ComponentProps<typeof ButtonPressAnimation>;

type HyperliquidButtonProps = BoxProps & {
  children: ReactNode;
  borderRadius?: number;
  onPress?: () => void;
  buttonProps?: Omit<ButtonPressAnimationProps, 'children' | 'onPress'>;
};

export const HyperliquidButton = function HyperliquidButton({ children, onPress, buttonProps, ...boxProps }: HyperliquidButtonProps) {
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <ButtonPressAnimation {...buttonProps} onPress={onPress}>
      <Box
        borderColor={{ custom: opacityWorklet('#ffffff', 0.16) }}
        borderWidth={isDarkMode ? 2 : 0}
        justifyContent="center"
        alignItems="center"
        height={48}
        borderRadius={24}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...boxProps}
      >
        {isDarkMode && (
          <>
            <LinearGradient
              colors={accentColors.gradient}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000', opacity: 0.12 }]} />
          </>
        )}
        {!isDarkMode && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: accentColors.opacity100 }]} />}
        {children}
      </Box>
    </ButtonPressAnimation>
  );
};
