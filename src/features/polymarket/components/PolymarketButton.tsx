import React, { ComponentProps, ReactNode } from 'react';
import { Box, BoxProps, useColorMode } from '@/design-system';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import LinearGradient from 'react-native-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { POLYMARKET_ACCENT_COLOR } from '@/features/polymarket/constants';

type ButtonPressAnimationProps = ComponentProps<typeof ButtonPressAnimation>;

type PolymarketButtonProps = BoxProps & {
  children: ReactNode;
  borderRadius?: number;
  onPress?: () => void;
  buttonProps?: Omit<ButtonPressAnimationProps, 'children' | 'onPress'>;
};

const GRADIENT = ['#3B62D6', '#DC5CEA', '#8BCAF2'];

export const PolymarketButton = function PolymarketButton({ children, onPress, buttonProps, ...boxProps }: PolymarketButtonProps) {
  const { isDarkMode } = useColorMode();
  const accentColor = POLYMARKET_ACCENT_COLOR;

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
            <LinearGradient colors={GRADIENT} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.darkModeOverlay} />
          </>
        )}
        {!isDarkMode && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: accentColor }]} />}
        {children}
      </Box>
    </ButtonPressAnimation>
  );
};

const styles = StyleSheet.create({
  darkModeOverlay: {
    backgroundColor: '#000000',
    opacity: 0.12,
    ...StyleSheet.absoluteFillObject,
  },
});
