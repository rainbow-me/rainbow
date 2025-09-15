import React from 'react';
import { Box, Separator, Stack, useBackgroundColor } from '@/design-system';
import { PerpsAccountBalanceCard } from '@/features/perps/screens/perps-account-screen/AccountBalanceCard';
import { OpenPositionsSection } from '@/features/perps/screens/perps-account-screen/OpenPositionsSection';
import { MarketsSection } from '@/features/perps/screens/perps-account-screen/MarketsSection';
import { FOOTER_HEIGHT } from '@/features/perps/constants';
import { ScrollView } from 'react-native';

export const PerpsAccountScreen = function PerpsAccountScreen() {
  const screenBackgroundColor = useBackgroundColor('surfacePrimary');
  const bottomInset = FOOTER_HEIGHT + 12;

  return (
    <ScrollView
      style={{ backgroundColor: screenBackgroundColor }}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomInset, paddingHorizontal: 20 }}
      scrollIndicatorInsets={{ bottom: bottomInset }}
    >
      <Box width="full">
        <Stack space={'20px'}>
          <PerpsAccountBalanceCard />
          <Separator color={'separatorTertiary'} direction="horizontal" />
          <OpenPositionsSection />
          <Separator color={'separatorTertiary'} direction="horizontal" />
          <MarketsSection />
        </Stack>
      </Box>
    </ScrollView>
  );
};
