import React, { memo, useMemo } from 'react';
import { Bleed, Box, Inline, Separator, Text, TextShadow, useColorMode, useForegroundColor } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { PerpMarket, PerpPositionSide } from '@/features/perps/types';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
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
import { HYPERLIQUID_GREEN, HYPERLIQUID_GREEN_LIGHT, PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';

export const NameAndPriceSection = memo(function NameAndPriceSection({
  symbol,
  leverage,
  side,
}: {
  symbol: string;
  leverage?: number;
  side?: PerpPositionSide;
}) {
  const { isDarkMode } = useColorMode();
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');

  const sideColor = useMemo(() => {
    return side === PerpPositionSide.LONG ? green : red;
  }, [side, green, red]);

  const sideBackgroundColor = useMemo(() => {
    return opacityWorklet(sideColor, 0.16);
  }, [sideColor]);

  const leverageColor = useMemo(() => {
    if (isDarkMode) return opacityWorklet(ETH_COLOR_DARK, 0.16);
    return opacityWorklet('#09111F', 0.04);
  }, [isDarkMode]);

  return (
    <Box gap={20}>
      <HyperliquidTokenIcon size={44} symbol={symbol} />

      <Box flexDirection="row" alignItems="center" gap={8}>
        <TextShadow blur={12} shadowOpacity={0.16}>
          <Text color={isDarkMode ? { custom: ETH_COLOR_DARK_ACCENT } : 'labelSecondary'} size="22pt" weight="heavy">
            {symbol}
          </Text>
        </TextShadow>

        <Bleed vertical="8px">
          <Inline space="6px">
            {leverage && (
              <Box
                paddingHorizontal="6px"
                height={24}
                justifyContent="center"
                alignItems="center"
                borderRadius={10}
                borderWidth={5 / 3}
                backgroundColor={leverageColor}
                borderColor={{ custom: leverageColor }}
              >
                <Text align="center" size="15pt" color={isDarkMode ? { custom: ETH_COLOR_DARK_ACCENT } : 'labelTertiary'} weight="heavy">
                  {`${leverage}x`}
                </Text>
              </Box>
            )}

            {side && (
              <Box
                paddingHorizontal={{ custom: 6.5 }}
                height={24}
                justifyContent="center"
                alignItems="center"
                borderRadius={10}
                borderWidth={5 / 3}
                backgroundColor={sideBackgroundColor}
                borderColor={{ custom: sideBackgroundColor }}
              >
                <Text align="right" size="15pt" color={{ custom: sideColor }} weight="heavy">
                  {side}
                </Text>
              </Box>
            )}
          </Inline>
        </Bleed>
      </Box>
    </Box>
  );
});

export const ChartSection = memo(function ChartSection({ symbol }: { symbol: string }) {
  const { isDarkMode } = useColorMode();
  const labelSecondary = useForegroundColor('labelSecondary');

  const color = isDarkMode ? ETH_COLOR_DARK : labelSecondary;
  const timeframeSelectorColor = isDarkMode ? HYPERLIQUID_GREEN : HYPERLIQUID_GREEN_LIGHT;
  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  return (
    <Chart
      accentColors={{
        color: color,
        opacity12: opacityWorklet(color, 0.12),
        opacity24: opacityWorklet(color, 0.24),
        timeframeSelector: timeframeSelectorColor,
      }}
      backgroundColor={backgroundColor}
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
  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;
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
          gap={28}
          paddingTop={{ custom: 96 }}
          paddingBottom={{ custom: SHEET_FOOTER_HEIGHT + safeAreaInsets.bottom }}
          paddingHorizontal="24px"
        >
          <NameAndPriceSection symbol={market.symbol} leverage={position?.leverage} side={position?.side} />
          <Bleed horizontal="24px" top="8px">
            <ChartSection symbol={market.symbol} />
          </Bleed>
          {position && (
            <>
              <OpenPositionSection market={market} />
              <Separator color={'separatorTertiary'} direction="horizontal" thickness={1} />
              <TriggerOrdersSection symbol={market.symbol} />
            </>
          )}
          <Separator color={'separatorTertiary'} direction="horizontal" thickness={1} />
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
