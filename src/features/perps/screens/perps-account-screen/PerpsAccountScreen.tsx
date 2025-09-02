import React from 'react';
import { Box, Separator, Stack, useBackgroundColor } from '@/design-system';
import SlackSheet from '@/components/sheet/SlackSheet';
import { IS_IOS } from '@/env';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PerpsAccountBalanceCard } from '@/features/perps/screens/perps-account-screen/AccountBalanceCard';
import { OpenPositionsSection } from '@/features/perps/screens/perps-account-screen/OpenPositionsSection';
import { MarketsSection } from '@/features/perps/screens/perps-account-screen/MarketsSection';
import { FOOTER_HEIGHT } from '@/features/perps/constants';

const PerpsAccountScreenContent = function PerpsAccountScreenContent() {
  return (
    <Box paddingTop={{ custom: 0 }} height="full" width="full" paddingHorizontal="20px" style={{ flex: 1 }}>
      <Stack space={'20px'}>
        <PerpsAccountBalanceCard />
        <Separator color={'separatorTertiary'} direction="horizontal" />
        <OpenPositionsSection />
        <Separator color={'separatorTertiary'} direction="horizontal" />
        <MarketsSection />
      </Stack>
    </Box>
  );
};

export const PerpsAccountScreen = function PerpsAccountScreen() {
  const screenBackgroundColor = useBackgroundColor('surfacePrimary');
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Box style={{ flex: 1 }}>
      <SlackSheet
        backgroundColor={screenBackgroundColor}
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
        style={{
          paddingBottom: FOOTER_HEIGHT,
          paddingTop: 20,
        }}
      >
        <PerpsAccountScreenContent />
      </SlackSheet>
    </Box>
  );
};
