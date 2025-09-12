import React, { memo, useEffect, useMemo } from 'react';
import { Bleed, Box, Separator, Text, TextShadow, useColorMode, useForegroundColor } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { PerpMarket, PerpPositionSide } from '@/features/perps/types';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { ChartType } from '@/features/charts/types';
import { PerpsAccentColorContextProvider, usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { Chart } from '@/components/value-chart/Chart';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CollapsibleSectionBase } from '@/components/collapsible/CollapsibleSectionBase';
import { useSharedValue } from 'react-native-reanimated';
import { HistorySection } from './HistorySection';
import { OpenPositionSection } from '@/features/perps/screens/perp-detail-screen/OpenPositionSection';
import { TriggerOrdersSection } from '@/features/perps/screens/perp-detail-screen/TriggerOrdersSection';
import SlackSheet from '@/components/sheet/SlackSheet';
import { IS_ANDROID, IS_IOS } from '@/env';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { ETH_COLOR_DARK, ETH_COLOR_DARK_ACCENT } from '@/__swaps__/screens/Swap/constants';
import { SHEET_FOOTER_HEIGHT, SheetFooter } from './SheetFooter';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';

export const NameAndPriceSection = memo(function NameAndPriceSection({
  symbol,
  leverage,
  side,
}: {
  symbol: string;
  leverage?: number;
  side?: PerpPositionSide;
}) {
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');

  const sideColor = useMemo(() => {
    return side === PerpPositionSide.LONG ? green : red;
  }, [side, green, red]);

  const sideBackgroundColor = useMemo(() => {
    return opacityWorklet(sideColor, 0.16);
  }, [sideColor]);

  return (
    <Box gap={20}>
      <HyperliquidTokenIcon symbol={symbol} style={{ width: 44, height: 44 }} />

      <Box flexDirection="row" alignItems="center" gap={8}>
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text size="22pt" weight="heavy" color="labelTertiary">
            {symbol}
          </Text>
        </TextShadow>

        {leverage && (
          <Box
            paddingHorizontal="6px"
            height={24}
            justifyContent="center"
            alignItems="center"
            borderRadius={10}
            borderWidth={5 / 3}
            backgroundColor={opacityWorklet(ETH_COLOR_DARK, 0.16)}
            borderColor={{ custom: opacityWorklet(ETH_COLOR_DARK, 0.16) }}
          >
            <Text size="15pt" color={{ custom: ETH_COLOR_DARK_ACCENT }} weight="heavy">
              {`${leverage}x`}
            </Text>
          </Box>
        )}

        {side && (
          <Box
            paddingHorizontal="6px"
            height={24}
            justifyContent="center"
            alignItems="center"
            borderRadius={10}
            borderWidth={5 / 3}
            backgroundColor={sideBackgroundColor}
            borderColor={{ custom: sideBackgroundColor }}
          >
            <Text size="15pt" color={{ custom: sideColor }} weight="heavy">
              {side}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
});

const BACKGROUND_COLOR_DARK = '#17191C';
const BACKGROUND_COLOR = '#FFFFFF';

export const ChartSection = memo(function ChartSection({ symbol }: { symbol: string }) {
  const { setToken, setChartType } = useChartsStore();

  useEffect(() => {
    setToken(symbol);
    setChartType(ChartType.Candlestick);
  }, [setToken, setChartType, symbol]);

  const color = ETH_COLOR_DARK;
  return (
    <Chart
      accentColors={{
        color: color,
        opacity12: opacityWorklet(color, 0.12),
        opacity24: opacityWorklet(color, 0.24),
      }}
      backgroundColor={BACKGROUND_COLOR_DARK}
      hyperliquidSymbol={symbol}
      hideChartTypeToggle
    />
  );
});

const HANDLE_COLOR = 'rgba(245, 248, 255, 0.3)';
const LIGHT_HANDLE_COLOR = 'rgba(9, 17, 31, 0.3)';

const PerpsDetailScreenContent = memo(function PerpsDetailScreenContent({ market }: { market: PerpMarket }) {
  const position = useHyperliquidAccountStore(state => state.getPosition(market.symbol));
  const { isDarkMode } = useColorMode();
  const backgroundColor = isDarkMode ? BACKGROUND_COLOR_DARK : BACKGROUND_COLOR;
  const colors = usePerpsAccentColorContext();
  const safeAreaInsets = useSafeAreaInsets();
  const historyExpanded = useSharedValue(true);

  const onToggleHistory = () => {
    'worklet';
    historyExpanded.value = !historyExpanded.value;
  };

  return (
    <>
      <SlackSheet
        backgroundColor={backgroundColor}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...(IS_IOS ? { height: '100%' } : {})}
        scrollEnabled
        removeTopPadding
        hideHandle
        showsVerticalScrollIndicator={false}
        additionalTopPadding={false}
        scrollIndicatorInsets={{
          bottom: safeAreaInsets.bottom,
          top: safeAreaInsets.top + 32,
        }}
      >
        <Box
          gap={20}
          paddingTop={{ custom: 96 }}
          paddingBottom={{ custom: SHEET_FOOTER_HEIGHT + safeAreaInsets.bottom }}
          paddingHorizontal="24px"
        >
          <NameAndPriceSection symbol={market.symbol} leverage={position?.leverage} side={position?.side} />
          <Bleed horizontal="24px">
            <ChartSection symbol={market.symbol} />
          </Bleed>
          {position && (
            <>
              <OpenPositionSection market={market} />
              <Separator color={'separatorTertiary'} direction="horizontal" />
              <TriggerOrdersSection symbol={market.symbol} />
            </>
          )}
          <Separator color={'separatorTertiary'} direction="horizontal" />
          <CollapsibleSectionBase
            iconColor={colors.accentColors.opacity100}
            icon="􀐫"
            content={<HistorySection market={market} />}
            primaryText="History"
            expanded={historyExpanded}
            onToggle={onToggleHistory}
          />
        </Box>
      </SlackSheet>
      <Box position="absolute" top="0px" left="0px" right="0px" width="full" pointerEvents="none">
        <Box backgroundColor={backgroundColor} height={safeAreaInsets.top + (IS_ANDROID ? 24 : 12)} width="full">
          <Box
            height={{ custom: 5 }}
            width={{ custom: 36 }}
            borderRadius={3}
            position="absolute"
            style={{ backgroundColor: isDarkMode ? HANDLE_COLOR : LIGHT_HANDLE_COLOR, bottom: 0, alignSelf: 'center' }}
          />
        </Box>
        <EasingGradient
          endColor={backgroundColor}
          startColor={backgroundColor}
          endOpacity={0}
          startOpacity={1}
          style={{ height: 32, width: '100%', pointerEvents: 'none' }}
        />
      </Box>
      <SheetFooter backgroundColor={backgroundColor} market={market} />
    </>
  );
});

export const PerpsDetailScreen = () => {
  const {
    params: { market },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.PERPS_DETAIL_SCREEN>>();

  return (
    <PerpsAccentColorContextProvider>
      <PerpsDetailScreenContent market={market} />
    </PerpsAccentColorContextProvider>
  );
};
