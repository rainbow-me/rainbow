import { Box, Text, TextIcon, useForegroundColor } from '@/design-system';
import { memo } from 'react';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import ImgixImage from '@/components/images/ImgixImage';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { LinearGradient } from 'react-native-linear-gradient';
import { StyleSheet } from 'react-native';
import { SkiaBadge } from '@/components/SkiaBadge';
import { lessThanWorklet, toPercentageWorklet } from '@/safe-math/SafeMath';
import { formatNumber } from '@/helpers/strings';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { PolymarketOutcome } from '@/features/polymarket/constants';

export const MarketsSection = memo(function MarketsSection() {
  const markets = usePolymarketEventStore(state => state.getMarkets());
  const uniqueMarketImages = usePolymarketEventStore(state => state.getData()?.uniqueMarketImages ?? false);
  const isSingleMarketEvent = markets?.length === 1;

  return (
    <Box gap={20}>
      <Box flexDirection="row" alignItems="center" gap={10}>
        <Box style={{ opacity: 0.4 }}>
          <TextIcon size="icon 17px" weight="bold" color="label">
            {'􀢊'}
          </TextIcon>
        </Box>
        <Text size="20pt" weight="heavy" color="label">
          {'Outcomes'}
        </Text>
      </Box>
      {isSingleMarketEvent && <SingleMarketEvent market={markets?.[0]} />}
      {!isSingleMarketEvent && (
        <Box gap={8}>
          {markets?.map(market => (
            <ButtonPressAnimation key={market.id} onPress={() => Navigation.handleAction(Routes.POLYMARKET_MARKET_SHEET, { market })}>
              <MarketRow
                accentColor={market.seriesColor || '#DC5CEA'}
                priceChange={market.oneDayPriceChange}
                image={uniqueMarketImages ? market.icon : undefined}
                title={market.groupItemTitle}
                volume={market.volume}
                tokenId={market.clobTokenIds[0]}
                price={String(market.lastTradePrice)}
              />
            </ButtonPressAnimation>
          ))}
        </Box>
      )}
    </Box>
  );
});

type MarketRowProps = {
  accentColor: string;
  priceChange: number;
  image?: string | undefined;
  title: string;
  volume: string;
  tokenId: string;
  price: string;
  // useMarketImage: boolean;
};

const MarketRow = memo(function MarketRow({ accentColor, priceChange, image, title, volume, tokenId, price }: MarketRowProps) {
  // const accentColor = market.seriesColor || '#DC5CEA';
  // const priceChange = market.oneDayPriceChange;
  const shouldShowPriceChange = Math.abs(priceChange) >= 0.01;

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
          <Text size="15pt" weight="bold" color="labelSecondary">
            {formatNumber(volume, { useOrderSuffix: true, decimals: 1, style: '$' })}
          </Text>
        </Box>
        <SkiaBadge
          text={`${toPercentageWorklet(price, 0.001)}%`}
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

const SingleMarketEvent = memo(function SingleMarketEvent({ market }: { market: PolymarketMarket }) {
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');

  return (
    <Box>
      <Box gap={8}>
        <ButtonPressAnimation
          onPress={() => Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, { market, outcome: PolymarketOutcome.YES })}
        >
          <MarketRow
            accentColor={green}
            priceChange={0}
            title={'Yes'}
            volume={market.volume}
            tokenId={market.clobTokenIds[0]}
            price={market.outcomePrices[0]}
          />
        </ButtonPressAnimation>

        <ButtonPressAnimation
          onPress={() => Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, { market, outcome: PolymarketOutcome.NO })}
        >
          <MarketRow
            accentColor={red}
            // TODO: Will need to include this as live price fetching or just accept it's not available
            priceChange={0}
            title={'No'}
            volume={market.volume}
            tokenId={market.clobTokenIds[1]}
            price={market.outcomePrices[1]}
          />
        </ButtonPressAnimation>
      </Box>
    </Box>
  );
});
