import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { DerivedValue, SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { AnimatedText, Bleed, Box, useColorMode } from '@/design-system';
import { AnimatedTextSelectorProps } from '@/design-system/components/Text/AnimatedText';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { LiquidationData, useLiquidationInfo } from '@/features/perps/stores/derived/useLiquidationInfo';
import { PerpMarket } from '@/features/perps/types';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import i18n from '@/languages';
import { TokenData } from '@/state/liveTokens/liveTokensStore';

export const LiquidationInfo = memo(function LiquidationInfo({ leverage, market }: { leverage: SharedValue<number>; market: PerpMarket }) {
  const midPrice = useLiveTokenSharedValue({
    tokenId: getHyperliquidTokenId(market.symbol),
    initialValue: market.price,
    selector: selectMidPrice,
  });

  const getInfo = useLiquidationInfo();

  return (
    <LiquidationInfoContent
      liquidationInfo={useDerivedValue(() => {
        return getInfo(leverage.value, midPrice.value);
      })}
      marketSymbol={market.symbol}
    />
  );
});

const translations = {
  fromCurrentPrice: i18n.perps.new_position.from_current_price(),
  liquidatedAt: i18n.perps.new_position.liquidated_at(),
  noLiquidationRisk: i18n.perps.new_position.no_liquidation_risk(),
  tradingWithoutLeverage: i18n.perps.new_position.trading_without_leverage(),
};

const infoSelectors = {
  bottomRowPercentage: info => {
    'worklet';
    return info.value?.distanceFromCurrentPriceDisplay;
  },
  bottomRowText: info => {
    'worklet';
    return info.value ? translations.fromCurrentPrice : translations.tradingWithoutLeverage;
  },
  topRowPrice: info => {
    'worklet';
    return info.value?.formattedLiquidationPrice;
  },
  topRowText: info => {
    'worklet';
    return info.value ? translations.liquidatedAt : translations.noLiquidationRisk;
  },
} satisfies {
  [key: string]: AnimatedTextSelectorProps<DerivedValue<LiquidationData | null>>['selector'];
};

const LiquidationInfoContent = memo(function LiquidationInfoContent({
  liquidationInfo,
  marketSymbol,
}: {
  liquidationInfo: DerivedValue<LiquidationData | null>;
  marketSymbol: string;
}) {
  const { colorMode } = useColorMode();

  const distanceFromStyle = useAnimatedStyle(() => {
    const distanceColor = liquidationInfo.value?.distanceFromCurrentPriceColor;
    const color = distanceColor ? getColorForTheme(distanceColor, colorMode) : 'transparent';
    const marginRight = distanceColor ? 4 : 0;
    const opacity = 0.8;
    const display = distanceColor ? 'flex' : 'none';
    return { display, color, marginRight, opacity };
  });

  const subtitleColorStyle = useAnimatedStyle(() => {
    const hasLiquidationRisk = liquidationInfo.value !== null;
    const color = getColorForTheme(hasLiquidationRisk ? 'labelQuaternary' : 'labelQuinary', colorMode);
    return { color };
  });

  const liquidationPriceStyle = useAnimatedStyle(() => ({ opacity: liquidationInfo.value ? 1 : 0 }));

  return (
    <Box gap={16}>
      <Box flexDirection="row" alignItems="center" gap={7}>
        <Bleed vertical="6px">
          <HyperliquidTokenIcon symbol={marketSymbol} size={16} />
        </Bleed>

        <Box flexDirection="row" alignItems="center" gap={4}>
          <AnimatedText color="labelQuaternary" size="15pt" weight="bold">
            {useDerivedValue(() => infoSelectors.topRowText(liquidationInfo))}
          </AnimatedText>

          <AnimatedText color="labelSecondary" size="15pt" style={[styles.flex, liquidationPriceStyle]} weight="heavy">
            {useDerivedValue(() => infoSelectors.topRowPrice(liquidationInfo))}
          </AnimatedText>
        </Box>
      </Box>

      <Box flexDirection="row" alignItems="center">
        <AnimatedText size="13pt" style={distanceFromStyle} weight="heavy">
          {useDerivedValue(() => infoSelectors.bottomRowPercentage(liquidationInfo))}
        </AnimatedText>

        <AnimatedText color="labelQuaternary" size="13pt" style={[styles.flex, subtitleColorStyle]} weight="bold">
          {useDerivedValue(() => infoSelectors.bottomRowText(liquidationInfo))}
        </AnimatedText>
      </Box>
    </Box>
  );
});

function selectMidPrice(state: TokenData): string {
  return state.midPrice ?? state.price;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
