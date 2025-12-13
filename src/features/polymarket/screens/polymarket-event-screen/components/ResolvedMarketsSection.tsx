import { Box, Text } from '@/design-system';
import { memo, useState } from 'react';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import ImgixImage from '@/components/images/ImgixImage';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { LinearGradient } from 'react-native-linear-gradient';
import { StyleSheet } from 'react-native';
import { formatNumber } from '@/helpers/strings';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { ButtonPressAnimation } from '@/components/animations';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';

export const ResolvedMarketsSection = memo(function ResolvedMarketsSection({
  markets,
  uniqueMarketImages,
}: {
  markets: PolymarketMarket[];
  uniqueMarketImages: boolean;
}) {
  const [showResolved, setShowResolved] = useState(false);

  return (
    <Box gap={24}>
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
              {showResolved ? 'Hide Resolved' : 'Show Resolved'}
            </Text>
            <Text size="17pt" weight="heavy" color="labelTertiary">
              {markets.length}
            </Text>
          </Box>
        </Box>
      </ButtonPressAnimation>
      {showResolved && (
        <Box gap={8}>
          {markets.map(market => {
            const resolvedOutcomeIndex = market.outcomePrices.findIndex(price => price === '1');
            const resolvedOutcome = market.outcomes[resolvedOutcomeIndex];

            return (
              <ResolvedMarketRow
                key={market.id}
                accentColor={market.color}
                image={uniqueMarketImages ? market.icon : undefined}
                title={market.groupItemTitle}
                volume={market.volume}
                outcome={resolvedOutcome}
                outcomeIndex={resolvedOutcomeIndex}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
});

const ResolvedMarketRow = memo(function ResolvedMarketRow({
  accentColor,
  image,
  title,
  volume,
  outcome,
  outcomeIndex,
}: {
  accentColor: string;
  image?: string | undefined;
  title: string;
  volume: string;
  outcome: string;
  outcomeIndex: number;
}) {
  return (
    <GradientBorderView
      borderGradientColors={[opacityWorklet(accentColor, 0.06), opacityWorklet(accentColor, 0)]}
      borderWidth={2.5}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 0 }}
      borderRadius={24}
      style={{ height: 66, marginRight: -4, overflow: 'hidden' }}
    >
      <LinearGradient
        colors={[opacityWorklet(accentColor, 0.14), opacityWorklet(accentColor, 0)]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        pointerEvents="none"
      />
      <Box height="full" flexDirection="row" alignItems="center" gap={12} paddingRight={{ custom: 15 }}>
        {image && (
          <ImgixImage
            enableFasterImage
            resizeMode="cover"
            size={40}
            source={{ uri: image }}
            style={{ height: 40, width: 40, borderRadius: 9 }}
          />
        )}
        <Box gap={12} style={{ flex: 1 }}>
          <Box flexDirection="row" alignItems="center" gap={8}>
            <Text size="17pt" weight="bold" color="label" numberOfLines={1}>
              {title}
            </Text>
          </Box>
          <Text size="15pt" weight="bold" color="labelSecondary">
            {formatNumber(volume, { useOrderSuffix: true, decimals: 1, style: '$' })}
          </Text>
        </Box>
        <Box
          backgroundColor={getSolidColorEquivalent({ background: accentColor, foreground: '#000000', opacity: 0.3 })}
          borderRadius={18}
          height={36}
          paddingHorizontal={'12px'}
          paddingVertical={'6px'}
          justifyContent="center"
          alignItems="center"
          borderWidth={2}
          borderColor={{ custom: opacityWorklet('#FFFFFF', 0.12) }}
          flexDirection="row"
          gap={6}
        >
          <InnerShadow borderRadius={10} color={opacityWorklet(accentColor, 0.24)} blur={2.5} dx={0} dy={1} />
          <Text size="13pt" weight="heavy" color="label">
            {outcomeIndex === 0 ? '􀆅' : '􀆄'}
          </Text>
          <Text size="15pt" weight="heavy" color="label">
            {outcome.toUpperCase()}
          </Text>
        </Box>
      </Box>
    </GradientBorderView>
  );
});
