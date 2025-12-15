import { Box, Text } from '@/design-system';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { memo } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { ScrollView } from 'react-native';

export const PolymarketMarketDescriptionSheet = memo(function PolymarketMarketDescriptionSheet() {
  const {
    params: { description },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_MARKET_DESCRIPTION_SHEET>>();
  return (
    <PanelSheet innerBorderWidth={THICKER_BORDER_WIDTH} panelStyle={{ maxHeight: 400 }}>
      <Box paddingTop={{ custom: 33 }}>
        <Box gap={24}>
          <Box paddingHorizontal={'24px'}>
            <Text size="26pt" weight="heavy" color="label">
              {'Rules'}
            </Text>
          </Box>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24 }}>
            <Text align="left" size="20pt / 135%" weight="medium" color="label">
              {description}
            </Text>
          </ScrollView>
        </Box>
      </Box>
    </PanelSheet>
  );
});
