import React, { ComponentProps, ReactNode } from 'react';
import { Box, BoxProps } from '@/design-system';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import LinearGradient from 'react-native-linear-gradient';
import { HYPERLIQUID_COLORS } from '@/features/perps/constants';
import { StyleSheet, View } from 'react-native';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

type ButtonPressAnimationProps = ComponentProps<typeof ButtonPressAnimation>;

type HyperliquidButtonProps = BoxProps & {
  children: ReactNode;
  borderRadius?: number;
  onPress?: () => void;
  buttonProps?: Omit<ButtonPressAnimationProps, 'children' | 'onPress'>;
};

export const HyperliquidButton = function HyperliquidButton({ children, onPress, buttonProps, ...boxProps }: HyperliquidButtonProps) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <ButtonPressAnimation {...buttonProps} onPress={onPress}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Box borderColor={{ custom: opacityWorklet('#ffffff', 0.16) }} borderWidth={2} {...boxProps}>
        <LinearGradient
          colors={HYPERLIQUID_COLORS.gradient}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000', opacity: 0.12 }]} />
        {children}
      </Box>
    </ButtonPressAnimation>
  );
};
