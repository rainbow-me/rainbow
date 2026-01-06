import React, { ComponentProps, ReactNode } from 'react';
import { Box, BoxProps, globalColors, useColorMode } from '@/design-system';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { StyleSheet } from 'react-native';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';

type ButtonPressAnimationProps = ComponentProps<typeof ButtonPressAnimation>;

type PolymarketButtonProps = BoxProps & {
  children: ReactNode;
  borderRadius?: number;
  onPress?: () => void;
  buttonProps?: Omit<ButtonPressAnimationProps, 'children' | 'onPress'>;
};

export const PolymarketButton = function PolymarketButton({ children, onPress, buttonProps, ...boxProps }: PolymarketButtonProps) {
  const { isDarkMode } = useColorMode();
  const fillColor = isDarkMode ? '#C863E8' : '#E445D3';

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <ButtonPressAnimation {...buttonProps} onPress={onPress}>
      <Box
        borderColor={{ custom: opacityWorklet(globalColors.white100, 0.08) }}
        borderWidth={isDarkMode ? StyleSheet.hairlineWidth : 0}
        backgroundColor={fillColor}
        justifyContent="center"
        alignItems="center"
        height={48}
        borderRadius={24}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...boxProps}
      >
        <InnerShadow borderRadius={24} color={opacityWorklet(globalColors.white100, 0.17)} blur={3} dx={0} dy={3} />
        {children}
      </Box>
    </ButtonPressAnimation>
  );
};
