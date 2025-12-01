import { StyleSheet } from 'react-native';
import { Box, Text } from '@/design-system';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { memo } from 'react';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { LinearGradient } from 'react-native-linear-gradient';
import ImgixImage from '@/components/images/ImgixImage';
import { lessThanWorklet, toPercentageWorklet } from '@/safe-math/SafeMath';
import { formatNumber } from '@/helpers/strings';
import { SkiaBadge } from '@/components/SkiaBadge';

type MarketRowProps = {
  accentColor: string;
  priceChange: number;
  image?: string | undefined;
  title: string;
  volume?: string;
  tokenId: string;
  price: string;
};

export const MarketRow = memo(function MarketRow({ accentColor, priceChange, image, title, volume, tokenId, price }: MarketRowProps) {
  const shouldShowPriceChange = Math.abs(priceChange) >= 0.01;

  const tokenPrice = useLiveTokenValue({
    tokenId: getPolymarketTokenId(tokenId),
    initialValue: price,
    selector: state => state.price,
  });

  return (
    <GradientBorderView
      borderGradientColors={[opacityWorklet(accentColor, 0.06), opacityWorklet(accentColor, 0)]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 0 }}
      borderRadius={24}
      style={{ overflow: 'hidden' }}
    >
      <LinearGradient
        colors={[opacityWorklet(accentColor, 0.14), opacityWorklet(accentColor, 0)]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        pointerEvents="none"
      />
      <Box height={66} flexDirection="row" alignItems="center" gap={12} paddingRight={'10px'}>
        {image && <ImgixImage resizeMode="cover" size={40} source={{ uri: image }} style={{ height: 40, width: 40, borderRadius: 9 }} />}
        <Box gap={12} style={{ flex: 1 }}>
          <Box flexDirection="row" alignItems="center" gap={8}>
            <Text size="17pt" weight="bold" color="label" numberOfLines={1}>
              {title}
            </Text>
            {shouldShowPriceChange && (
              <Box flexDirection="row" alignItems="center" gap={3}>
                <Text
                  size="icon 8px"
                  weight="heavy"
                  color={lessThanWorklet(priceChange, 0) ? 'red' : 'green'}
                  style={{ transform: lessThanWorklet(priceChange, 0) ? [{ rotate: '180deg' }] : [] }}
                >
                  {'􀛤'}
                </Text>
                <Text size="15pt" weight="heavy" color={lessThanWorklet(priceChange, 0) ? 'red' : 'green'}>
                  {`${toPercentageWorklet(Math.abs(priceChange))}%`}
                </Text>
              </Box>
            )}
          </Box>
          {volume !== undefined && (
            <Text size="15pt" weight="bold" color="labelSecondary">
              {formatNumber(volume, { useOrderSuffix: true, decimals: 1, style: '$' })}
            </Text>
          )}
        </Box>
        <SkiaBadge
          text={`${toPercentageWorklet(tokenPrice, 0.001)}%`}
          textColor={{ custom: accentColor }}
          gradientFill={[
            {
              colors: [opacityWorklet(accentColor, 0.16), opacityWorklet(accentColor, 0.08)],
              start: { x: 0, y: 0 },
              end: { x: 0, y: 1 },
            },
          ]}
          innerShadows={[{ dx: 0, dy: 1, blur: 2.5, color: opacityWorklet(accentColor, 0.24) }]}
          strokeColor={opacityWorklet(accentColor, 0.06)}
          strokeWidth={2.5}
          fontSize="26pt"
          fontWeight="heavy"
          height={46}
          paddingHorizontal={12}
          borderRadius={16}
        />
      </Box>
    </GradientBorderView>
  );
});
