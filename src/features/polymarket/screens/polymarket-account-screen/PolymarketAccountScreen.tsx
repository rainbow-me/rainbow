import React from 'react';
import { StyleSheet } from 'react-native';
import { Box, Separator, Text, TextIcon, useColorMode } from '@/design-system';
import { PolymarketAccountBalanceCard } from '@/features/polymarket/components/PolymarketAccountBalanceCard';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { PolymarketOpenPositionsSection } from '@/features/polymarket/components/PolymarketOpenPositionsSection';
import SlackSheet from '@/components/sheet/SlackSheet';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { getSolidColorEquivalent } from '@/worklets/colors';

const HANDLE_COLOR = 'rgba(245, 248, 255, 0.3)';
const LIGHT_HANDLE_COLOR = 'rgba(9, 17, 31, 0.3)';

export const PolymarketAccountScreen = function PolymarketAccountScreen() {
  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();
  const backgroundColor = getSolidColorEquivalent({ background: '#1D0E20', foreground: '#000000', opacity: 0.4 });

  return (
    <>
      <SlackSheet
        backgroundColor={backgroundColor}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...(IS_IOS ? { height: '100%' } : {})}
        scrollEnabled
        removeTopPadding
        hideHandle
        showsVerticalScrollIndicator={false}
        additionalTopPadding={false}
        scrollIndicatorInsets={{
          bottom: safeAreaInsets.bottom,
          top: safeAreaInsets.top + 32,
        }}
      >
        <Box gap={20} width="full" paddingTop={'104px'} paddingHorizontal={'16px'}>
          <Box flexDirection="row" alignItems="center" gap={12} justifyContent="center">
            <TextIcon size="icon 17px" weight="bold" color="label">
              {'􀫸'}
            </TextIcon>
            <Text size="20pt" weight="heavy" color="label" align="center">
              {'Prediction'}
            </Text>
          </Box>
          <PolymarketAccountBalanceCard accentColor={'#C55DE7'} />
          <Separator color="separatorTertiary" direction="horizontal" thickness={THICK_BORDER_WIDTH} />
          <PolymarketOpenPositionsSection />
        </Box>
      </SlackSheet>
      <Box position="absolute" top="0px" left="0px" right="0px" width="full" pointerEvents="none">
        <Box backgroundColor={backgroundColor} height={safeAreaInsets.top + (IS_ANDROID ? 24 : 12)} width="full">
          <Box
            height={{ custom: 5 }}
            width={{ custom: 36 }}
            borderRadius={3}
            position="absolute"
            style={{ backgroundColor: isDarkMode ? HANDLE_COLOR : LIGHT_HANDLE_COLOR, bottom: 0, alignSelf: 'center' }}
          />
        </Box>
        <EasingGradient
          endColor={backgroundColor}
          startColor={backgroundColor}
          endOpacity={0}
          startOpacity={1}
          style={{ height: 32, width: '100%', pointerEvents: 'none' }}
        />
      </Box>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
