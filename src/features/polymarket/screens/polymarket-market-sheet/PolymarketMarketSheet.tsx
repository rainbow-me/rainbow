import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { Bleed, Box, globalColors, Separator, Text, TextShadow, useColorMode, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';
import { PANEL_WIDTH, PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { PolymarketEvent, PolymarketMarket, PolymarketMarketEvent } from '@/features/polymarket/types/polymarket-event';
import ImgixImage from '@/components/images/ImgixImage';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Navigation } from '@/navigation';
import { getColorValueForThemeWorklet, opacityWorklet } from '@/__swaps__/utils/swaps';
import { LinearGradient } from 'expo-linear-gradient';
import { PolymarketChart } from '@/features/charts/polymarket/components/PolymarketChart';
import { PolymarketTimeframeSelector } from '@/features/charts/polymarket/components/PolymarketTimeframeSelector';
import { getChartLineColors } from '@/features/charts/polymarket/utils/getChartLineColors';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { toPercentageWorklet } from '@/safe-math/SafeMath';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';

export const PolymarketMarketSheet = memo(function PolymarketMarketSheet() {
  const {
    params: { market, event },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_MARKET_SHEET>>();

  const { isDarkMode } = useColorMode();
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const accentColor = getColorValueForThemeWorklet(market.color, isDarkMode);
  const lineColors = useMemo(() => getChartLineColors([market]), [market]);

  return (
    <PanelSheet innerBorderWidth={THICKER_BORDER_WIDTH} panelStyle={{ backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' }}>
      <LinearGradient
        colors={[opacityWorklet(accentColor, 0.22), opacityWorklet(accentColor, 0)]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <Box paddingHorizontal="24px" paddingBottom={'24px'} paddingTop={{ custom: 33 }}>
        <Box gap={20}>
          <Header market={market} event={event} />
          <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
          <Bleed horizontal="24px">
            <Box borderRadius={16} gap={8} justifyContent="center" overflow="hidden" width={PANEL_WIDTH}>
              <PolymarketChart
                backgroundColor={isDarkMode ? '#000000' : '#FFFFFF'}
                chartWidth={PANEL_WIDTH}
                config={lineColors ? { line: { colors: lineColors, overrideSeriesColors: true } } : undefined}
                isMarketChart
              />
              <Bleed horizontal="8px">
                <PolymarketTimeframeSelector
                  backgroundColor={isDarkMode ? globalColors.grey100 : globalColors.white100}
                  color={accentColor}
                />
              </Bleed>
            </Box>
          </Bleed>
        </Box>
        <Box paddingTop={'24px'} gap={12}>
          {market.outcomes.map((outcome, index) => {
            const buttonColor = index === 0 ? green : red;
            return (
              <ButtonPressAnimation
                key={outcome}
                onPress={() =>
                  Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, {
                    market,
                    event,
                    outcomeIndex: index,
                    outcomeColor: accentColor,
                    fromRoute: Routes.POLYMARKET_MARKET_SHEET,
                  })
                }
              >
                <Box
                  height={56}
                  backgroundColor={opacityWorklet(buttonColor, 0.16)}
                  borderRadius={28}
                  borderWidth={2.5}
                  borderColor={{ custom: opacityWorklet(buttonColor, 0.06) }}
                  paddingHorizontal="24px"
                  justifyContent="space-between"
                  alignItems="center"
                  flexDirection="row"
                >
                  <TextShadow blur={40} shadowOpacity={0.6}>
                    <Text size="22pt" weight="heavy" color={{ custom: buttonColor }}>
                      {i18n.t(i18n.l.predictions.market.buy_outcome, { outcome })}
                    </Text>
                  </TextShadow>

                  {/* TODO: Causing issues */}
                  {/* <TextShadow blur={40} shadowOpacity={0.6}> */}
                  <LiveTokenText
                    size="22pt"
                    weight="heavy"
                    color={{ custom: buttonColor }}
                    tokenId={getPolymarketTokenId(market.clobTokenIds[index], 'sell')}
                    selector={token => `${toPercentageWorklet(token.price)}%`}
                    initialValue={`${toPercentageWorklet(market.outcomePrices[index] ?? 0)}%`}
                  />
                  {/* </TextShadow> */}
                </Box>
              </ButtonPressAnimation>
            );
          })}
        </Box>
      </Box>
    </PanelSheet>
  );
});

const Header = memo(function Header({ market, event }: { market: PolymarketMarket; event: PolymarketEvent | PolymarketMarketEvent }) {
  const isLongGroupItemTitle = market.groupItemTitle?.length > 20;

  return (
    <Box flexDirection="row" alignItems="flex-start" gap={16}>
      <ImgixImage
        enableFasterImage
        resizeMode="cover"
        size={52}
        source={{ uri: market.icon }}
        style={{ height: 52, width: 52, borderRadius: 12 }}
      />
      <Box gap={12} style={{ flex: 1 }}>
        <Text size="15pt" weight="bold" color="labelQuaternary" numberOfLines={1}>
          {event.title}
        </Text>
        <Text size={isLongGroupItemTitle ? '22pt' : '26pt'} weight="heavy" color="label">
          {market.groupItemTitle}
        </Text>
      </Box>
    </Box>
  );
});
