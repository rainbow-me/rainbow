import { memo } from 'react';

import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Text, useForegroundColor } from '@/design-system';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { PerpsNameRow } from '@/features/perps/components/PerpsNameRow';
import { usePerpAnnotationsStore } from '@/features/perps/stores/perpAnnotationsStore';

export const PerpsAboutSheet = memo(function PerpsAboutSheet() {
  const annotation = usePerpAnnotationsStore(state => state.getAnnotation());
  const symbol = usePerpAnnotationsStore(state => state.currentSymbol);
  const separatorSecondaryColor = useForegroundColor('separatorSecondary');

  return (
    <PanelSheet innerBorderWidth={1} innerBorderColor={separatorSecondaryColor}>
      <Box paddingHorizontal="24px" paddingTop="36px" paddingBottom="36px" gap={20}>
        <HyperliquidTokenIcon size={44} symbol={symbol} />
        <Box flexDirection="row" alignItems="flex-end" gap={6}>
          <PerpsNameRow symbol={symbol} name={annotation?.displayName} nameColor="label" nameSize="26pt" />
        </Box>
        {annotation?.description && (
          <Text color="labelTertiary" size="17pt" weight="medium">
            {annotation.description}
          </Text>
        )}
      </Box>
    </PanelSheet>
  );
});
