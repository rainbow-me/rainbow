import React from 'react';
import { SectionId, useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';
import { AccentColorProvider, Box, ColorModeProvider, Separator, Stack } from '@/design-system';
import { CollapsibleSection, LAYOUT_ANIMATION } from './shared/CollapsibleSection';
import Animated from 'react-native-reanimated';
import { AboutSection, BalanceSection, BridgeSection, BuySection } from './sections';
import { ScrollView } from 'react-native';
import { deviceUtils } from '@/utils';

export function SheetContent() {
  const { accentColors, asset } = useExpandedAssetSheetContext();
  return (
    <AccentColorProvider color={accentColors.opacity100}>
      <ScrollView style={{ height: deviceUtils.dimensions.height }} contentContainerStyle={{ minHeight: deviceUtils.dimensions.height }}>
        <ColorModeProvider value="dark">
          <Box height="full" width="full" paddingTop={{ custom: 96 }} paddingBottom={{ custom: 47 }} paddingHorizontal="24px">
            <Stack
              space="28px"
              separator={
                <Animated.View layout={LAYOUT_ANIMATION}>
                  <Separator color={{ custom: 'rgba(245, 248, 255, 0.03)' }} thickness={1} />
                </Animated.View>
              }
            >
              <BalanceSection />
              <CollapsibleSection content={<BuySection />} icon="􀋥" id={SectionId.BUY} primaryText="Buy" secondaryText={asset.symbol} />
              <CollapsibleSection content={<BridgeSection />} icon="􀄹" id={SectionId.BRIDGE} primaryText="Bridge" secondaryText="to" />
              <CollapsibleSection content={<AboutSection />} icon="􁜾" id={SectionId.ABOUT} primaryText="About" />
            </Stack>
          </Box>
        </ColorModeProvider>
      </ScrollView>
    </AccentColorProvider>
  );
}
