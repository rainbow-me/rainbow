import React, { memo } from 'react';
import {
  AccentColorProvider,
  AnimatedText,
  Bleed,
  Box,
  ColorModeProvider,
  Separator,
  Stack,
  Text,
  TextShadow,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import { PerpsNavbar } from '@/features/perps/components/PerpsNavbar';
import { RouteProp, useRoute } from '@react-navigation/native';
import { PerpsStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { LiveTokenText, useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { formatPriceChange } from '@/features/perps/utils';
import { PerpMarket } from '@/features/perps/types';
import { SizeInputCard } from '@/features/perps/screens/perps-new-position-screen/SizeInputCard';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { BalanceSection, BuySection, ClaimSection, MarketStatsSection } from '@/screens/expandedAssetSheet/components/sections';
import { SHEET_FOOTER_HEIGHT } from '@/screens/expandedAssetSheet/components/SheetFooter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ExpandedAssetSheetContextProvider,
  useExpandedAssetSheetContext,
} from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { RAINBOW_COIN_EFFECT, useExperimentalFlag } from '@/config';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { colors } from '@/styles';
import { Chart } from '@/components/value-chart/Chart';
import { useAsset } from '@/hooks';

type MarketInfoSectionProps = {
  market: PerpMarket;
};

function MarketInfoSection({ market }: MarketInfoSectionProps) {
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const labelTertiary = useForegroundColor('labelTertiary');

  return (
    <Box flexDirection="row" alignItems="center" gap={12}>
      <HyperliquidTokenIcon symbol={market.symbol} style={{ width: 40, height: 40 }} />
      <Box gap={12}>
        <Text size="17pt" weight="bold" color="label">
          {market.symbol}
        </Text>
        <Box flexDirection="row" alignItems="center" gap={8}>
          <LiveTokenText
            tokenId={`${market.symbol}:hl`}
            initialValue={formatAssetPrice({ value: market.price, currency: 'USD' })}
            initialValueLastUpdated={0}
            selector={token => {
              return formatAssetPrice({ value: token.price, currency: 'USD' });
            }}
            size="15pt"
            weight="bold"
            color="labelSecondary"
          />
          <LiveTokenText
            selector={state => {
              return formatPriceChange(state.change.change24hPct);
            }}
            tokenId={`${market.symbol}:hl`}
            initialValueLastUpdated={0}
            initialValue={formatPriceChange(market.priceChange['24h'])}
            autoSubscriptionEnabled={false}
            usePriceChangeColor
            priceChangeChangeColors={{
              positive: green,
              negative: red,
              neutral: labelTertiary,
            }}
            color={'label'}
            size="15pt"
            weight="bold"
            align="right"
          />
        </Box>
      </Box>
    </Box>
  );
}

function DetailsSection() {
  return (
    <Box>
      <Text size="20pt" weight="heavy" color={'label'}>
        {'Details'}
      </Text>
    </Box>
  );
}

export const NameAndPriceSection = memo(function NameAndPriceSection({ market }: { market: PerpMarket }) {
  const shouldUseRainbowCoinEffect = useExperimentalFlag(RAINBOW_COIN_EFFECT);
  const { accentColors } = usePerpsAccentColorContext();

  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const labelTertiary = useForegroundColor('labelTertiary');

  console.log('MARKET', market);

  const livePrice = useLiveTokenSharedValue({
    tokenId: `${market.symbol}:hl`,
    initialValue: formatAssetPrice({ value: market.price, currency: 'USD' }),
    selector: state => {
      return formatAssetPrice({ value: state.price, currency: 'USD' });
    },
  });

  return (
    <Box gap={20}>
      <HyperliquidTokenIcon symbol={market.symbol} style={{ width: 44, height: 44 }} />
      <Box flexDirection="row" alignItems="center" gap={8}>
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text size="22pt" weight="heavy" color="labelTertiary" testID={`chart-header-${market.symbol}`}>
            Ethereum
          </Text>
        </TextShadow>

        <Box
          paddingHorizontal="6px"
          height={24}
          justifyContent="center"
          alignItems="center"
          borderRadius={10}
          borderWidth={1.67}
          // TODO (kane): real token color, blocked by backend
          backgroundColor={opacityWorklet('#677483', 0.16)}
          borderColor={{ custom: opacityWorklet('#677483', 0.16) }}
        >
          <Text size="15pt" color="labelTertiary" weight="heavy">
            10x
          </Text>
        </Box>
        <Box
          paddingHorizontal="6px"
          height={24}
          justifyContent="center"
          alignItems="center"
          borderRadius={10}
          borderWidth={1.67}
          backgroundColor={opacityWorklet(colors.green, 0.16)}
          borderColor={{ custom: opacityWorklet(colors.green, 0.16) }}
        >
          <Text size="15pt" color="green" weight="heavy">
            LONG
          </Text>
        </Box>
      </Box>
      <Box gap={20}>
        <AnimatedText size="34pt" weight="heavy" color="label" testID={`chart-header-${market.symbol}-price`}>
          {livePrice}
        </AnimatedText>

        <Box flexDirection="row" alignItems="center" gap={8}>
          <LiveTokenText
            selector={state => {
              return formatPriceChange(state.change.change24hPct);
            }}
            tokenId={`${market.symbol}:hl`}
            initialValueLastUpdated={0}
            initialValue={formatPriceChange(market.priceChange['24h'])}
            autoSubscriptionEnabled={false}
            usePriceChangeColor
            priceChangeChangeColors={{
              positive: green,
              negative: red,
              neutral: labelTertiary,
            }}
            color="label"
            size="20pt"
            weight="heavy"
          />
          <Box
            paddingHorizontal="6px"
            height={24}
            justifyContent="center"
            alignItems="center"
            borderRadius={10}
            borderWidth={2}
            // TODO (kane): real token color, blocked by backend
            backgroundColor={opacityWorklet('#000000', 0.08)}
            borderColor={{ custom: opacityWorklet('##9CA4AD', 0.16) }}
          >
            <Text size="15pt" color="labelQuaternary" weight="heavy">
              15m
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

export const ChartSection = memo(function ChartSection() {
  // Hardcoded ETH asset for chart with complete price data
  const asset = {
    address: '0x0000000000000000000000000000000000000000',
    chainId: 1,
    uniqueId: 'eth_1',
    network: 'ethereum',
    isNativeAsset: true,
    decimals: 18,
    iconUrl: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png',
    name: 'Ethereum',
    symbol: 'ETH',
    price: {
      value: 3500,
      relativeChange24h: 0.05,
      change: 'positive',
      changed: true,
    },
    networks: {
      1: {
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
      },
    },
    colors: {
      primary: '#627EEA',
      fallback: '#627EEA',
      shadow: '#627EEA',
    },
    transferable: true,
    creationDate: null,
    // Additional fields that might be needed
    marketCap: 400000000000,
    volume: 20000000000,
    circulatingSupply: 120000000,
    totalSupply: 120000000,
    allTime: {
      high: 4800,
      low: 0.43,
    },
    chartData: [],
    yearHigh: 4000,
    yearLow: 1500,
  };

  // Hardcoded accent colors matching AssetAccentColors type
  const accentColors = {
    color: '#627EEA',
    textOnAccent: '#FFFFFF',
    background: 'rgba(98, 126, 234, 0.08)',
    border: 'rgba(98, 126, 234, 0.12)',
    shadow: 'rgba(98, 126, 234, 0.24)',
    opacity04: 'rgba(98, 126, 234, 0.04)',
    opacity4: 'rgba(98, 126, 234, 0.04)',
    opacity6: 'rgba(98, 126, 234, 0.06)',
    opacity8: 'rgba(98, 126, 234, 0.08)',
    opacity10: 'rgba(98, 126, 234, 0.10)',
    opacity12: 'rgba(98, 126, 234, 0.12)',
    opacity16: 'rgba(98, 126, 234, 0.16)',
    opacity20: 'rgba(98, 126, 234, 0.20)',
    opacity24: 'rgba(98, 126, 234, 0.24)',
    opacity32: 'rgba(98, 126, 234, 0.32)',
    opacity48: 'rgba(98, 126, 234, 0.48)',
    opacity56: 'rgba(98, 126, 234, 0.56)',
    opacity100: 'rgba(98, 126, 234, 1)',
  };

  return (
    <Bleed horizontal="24px">
      <Chart asset={asset} backgroundColor={accentColors.opacity100} accentColors={accentColors} />
    </Bleed>
  );
});

export const PerpsExpandedStateScreen = memo(function PerpsExpandedStateScreen() {
  const {
    params: { market },
  } = useRoute<RouteProp<PerpsStackParamList, typeof Routes.PERPS_EXPANDED_STATE_SCREEN>>();
  const safeAreaInsets = useSafeAreaInsets();
  const { accentColors } = usePerpsAccentColorContext();
  // const positions = useHyperliquidAccountStore(state => state.positions);
  //
  // const position = positions.find(pos => pos.symbol === market.symbol);
  //
  // if (!position) return null;

  return (
    <Box background={'surfacePrimary'} paddingHorizontal={'20px'} style={{ flex: 1 }}>
      <Box
        height="full"
        width="full"
        paddingTop={{ custom: 96 }}
        paddingBottom={{ custom: SHEET_FOOTER_HEIGHT + safeAreaInsets.bottom }}
        paddingHorizontal="24px"
      >
        <Box gap={32}>
          <Box gap={20}>
            <NameAndPriceSection market={market} />
            <ChartSection />
          </Box>
        </Box>
      </Box>

      {/* <AccentColorProvider color={accentColors}>
        <ColorModeProvider value={colorMode}>
          <Box
            height="full"
            width="full"
            paddingTop={{ custom: 96 }}
            paddingBottom={{ custom: SHEET_FOOTER_HEIGHT + safeAreaInsets.bottom }}
            paddingHorizontal="24px"
          >
            <Box gap={32}>
              <Box gap={20}>
                <NameAndLogoSection />
                <ChartSection />
              </Box>
            </Box>
          </Box>
        </ColorModeProvider>
      </AccentColorProvider> */}
    </Box>
  );
});
