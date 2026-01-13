import { Box } from '@/design-system/components/Box/Box';
import { Separator } from '@/design-system/components/Separator/Separator';
import { Text } from '@/design-system/components/Text/Text';
import * as i18n from '@/languages';
import { memo, useState } from 'react';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ResolvedMarketsList } from '@/features/polymarket/screens/polymarket-event-screen/components/ResolvedMarketsList';

export const ResolvedMarketsSection = memo(function ResolvedMarketsSection({
  markets,
  showMarketImages,
}: {
  markets: PolymarketMarket[];
  showMarketImages: boolean;
}) {
  const [showResolved, setShowResolved] = useState(false);

  return (
    <Box gap={24}>
      {showResolved && (
        <Box gap={24}>
          <Separator color="separatorSecondary" direction="horizontal" thickness={1} />
          <ResolvedMarketsList markets={markets} showMarketImages={showMarketImages} />
        </Box>
      )}
      <ButtonPressAnimation onPress={() => setShowResolved(prev => !prev)}>
        <Box
          width={'full'}
          height={40}
          justifyContent="center"
          alignItems="center"
          backgroundColor={opacityWorklet('#F5F8FF', 0.04)}
          borderWidth={2}
          borderColor={{ custom: opacityWorklet('#F5F8FF', 0.02) }}
          borderRadius={20}
        >
          <Box flexDirection="row" alignItems="center" gap={12}>
            <Text size="17pt" weight="heavy" color="label">
              {showResolved ? i18n.t(i18n.l.predictions.event.hide_resolved) : i18n.t(i18n.l.predictions.event.show_resolved)}
            </Text>
            <Text size="17pt" weight="heavy" color="labelTertiary">
              {markets.length}
            </Text>
          </Box>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
});
