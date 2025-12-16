import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { Bleed, Box, globalColors, Separator, Text, useColorMode, useForegroundColor } from '@/design-system';
import { PANEL_WIDTH, PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import ImgixImage from '@/components/images/ImgixImage';
import { formatNumber } from '@/helpers/strings';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Navigation } from '@/navigation';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import LinearGradient from 'react-native-linear-gradient';
import { PolymarketChart } from '@/features/charts/polymarket/components/PolymarketChart';
import { PolymarketTimeframeSelector } from '@/features/charts/polymarket/components/PolymarketTimeframeSelector';
import { getChartLineColors } from '@/features/charts/polymarket/utils/getChartLineColors';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

const CHART_HEIGHT = 280;

export const PolymarketMarketSheet = memo(function PolymarketMarketSheet() {
  const {
    params: { market },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_MARKET_SHEET>>();

  const { isDarkMode } = useColorMode();
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const accentColor = market.color;
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
          <Header market={market} />
          <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
          <Bleed horizontal="24px">
            <Box borderRadius={16} gap={8} justifyContent="center" overflow="hidden" width={PANEL_WIDTH}>
              <PolymarketChart
                backgroundColor={isDarkMode ? '#000000' : '#FFFFFF'}
                chartHeight={CHART_HEIGHT}
                chartWidth={PANEL_WIDTH}
                config={lineColors ? { line: { colors: lineColors, overrideSeriesColors: true } } : undefined}
                isMarketChart
              />
              <Bleed horizontal="8px">
                <PolymarketTimeframeSelector
                  backgroundColor={isDarkMode ? '#000000' : '#FFFFFF'}
                  color={lineColors?.[0] ?? globalColors.white100}
                />
              </Bleed>
            </Box>
          </Bleed>
        </Box>
        <Box paddingTop={'24px'} gap={12}>
          {market.outcomes.map((outcome, index) => {
            return (
              <ButtonPressAnimation
                key={outcome}
                onPress={() =>
                  Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, {
                    market,
                    outcomeIndex: index,
                    outcomeColor: accentColor,
                  })
                }
              >
                <Box
                  height={56}
                  backgroundColor={opacityWorklet(accentColor, 0.16)}
                  borderRadius={28}
                  borderWidth={2.5}
                  borderColor={{ custom: opacityWorklet(accentColor, 0.06) }}
                  paddingHorizontal="24px"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text size="22pt" weight="heavy" color={{ custom: accentColor }}>
                    {`Buy ${outcome}`}
                  </Text>
                </Box>
              </ButtonPressAnimation>
            );
          })}
        </Box>
      </Box>
    </PanelSheet>
  );
});

const Header = memo(function Header({ market }: { market: PolymarketMarket }) {
  return (
    <Box>
      <Box flexDirection="row" alignItems="center" gap={14}>
        <ImgixImage
          enableFasterImage
          resizeMode="cover"
          size={56}
          source={{ uri: market.icon }}
          style={{ height: 56, width: 56, borderRadius: 12 }}
        />
        <Box gap={14}>
          <Text size="26pt" weight="heavy" color="label">
            {market.groupItemTitle}
          </Text>
          <Text size="15pt" weight="bold" color="labelQuaternary">
            {formatNumber(market.volume, { useOrderSuffix: true, decimals: 1, style: '$' })}
          </Text>
        </Box>
      </Box>
    </Box>
  );
});
