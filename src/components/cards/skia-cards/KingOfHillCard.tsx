import React, { useCallback, useMemo } from 'react';
import * as i18n from '@/languages';
import { useDimensions } from '@/hooks';
import { SkiaCard, SkiaCardProps } from './SkiaCard';
import { Blur, Group, Image, useImage, vec } from '@shopify/react-native-skia';
import { AnimatedText, Box, globalColors, Inline, Text, TextShadow, useColorMode, useForegroundColor } from '@/design-system';
import { opacity } from '@/__swaps__/utils/swaps';
import { ShinyCoinIcon } from '@/components/coin-icon/ShinyCoinIcon';
import { formatCurrency, formatNumber } from '@/helpers/strings';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import FastImage from 'react-native-fast-image';
import { getSizedImageUrl } from '@/handlers/imgix';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { useDerivedValue } from 'react-native-reanimated';
import { useAnimatedCountdown } from '@/hooks/reanimated/useAnimatedCountdown';
import { KingOfTheHillKing, KingOfTheHillToken, useKingOfTheHillStore } from '@/state/kingOfTheHill/kingOfTheHillStore';

const CARD_HEIGHT = 84;
const DEFAULT_CARD_SIZE = 300;

const CARD_CONFIG = {
  backgroundBlur: {
    size: 40,
    opacity: 1,
    radius: 50,
    yOffset: -20,
  },
  colors: {
    black28: opacity(globalColors.grey100, 0.28),
    black30: opacity(globalColors.grey100, 0.3),
    white08: opacity(globalColors.white100, 0.08),
  },
  gradient: {
    colors: ['#1F6480', '#2288AD', '#2399C3', '#399EC6', '#518EAB', '#4E697B'],
    end: vec(DEFAULT_CARD_SIZE / 2, CARD_HEIGHT),
    start: vec(DEFAULT_CARD_SIZE / 2, 0),
  },
};

const CARD_PROPS: Partial<SkiaCardProps> = {
  shadowColor: {
    dark: CARD_CONFIG.colors.black30,
    light: opacity(CARD_CONFIG.gradient.colors[CARD_CONFIG.gradient.colors.length - 1], 0.48),
  },
  strokeOpacity: { start: 0.12, end: 0.04 },
};

type KingOfHillKing = {
  token: {
    address: string;
    chainId: string;
    name: string;
    symbol: string;
    iconUrl: string;
    colors: {
      primary: string;
      secondary: string;
      shadow: string;
    };
    price: {
      value: number;
      relativeChange24h: number;
    };
  };
  window: {
    start: number;
    end: number;
  };
  marketStats: {
    '24hVol': number;
  };
  kingSince: number;
};

function AnimatedCountdownText({ targetUnixTimestamp }: { targetUnixTimestamp: number }) {
  const countdown = useAnimatedCountdown(targetUnixTimestamp);

  const timeString = useDerivedValue(() => {
    'worklet';
    return `${countdown.value} LEFT`;
  });

  return (
    <AnimatedText color="label" tabularNumbers size="11pt" weight="heavy">
      {timeString}
    </AnimatedText>
  );
}

function KingOfHillCard({ king }: { king: KingOfTheHillKing }) {
  const { navigate } = useNavigation();
  const separatorColor = useForegroundColor('separator');
  const { token } = king;
  const coinIconImage = useImage(king.token.iconUrl);

  const { width } = useDimensions();
  const cardWidth = width - 20 * 2;
  const hasTokenPriceIncreased = token.price.relativeChange24h > 0;
  const sizedIconUrl = getSizedImageUrl(token.iconUrl, 40);

  const { marketCap, price, priceChange24h, volume } = useMemo(
    () => ({
      marketCap: formatNumber(token.market.marketCap, { useOrderSuffix: true, decimals: 1, style: '$' }),
      price: formatCurrency(token.price.value),
      priceChange24h: `${formatNumber(token.price.relativeChange24h, { decimals: 2, useOrderSuffix: true })}%`,
      volume: formatNumber(token.market.volume.h24, { useOrderSuffix: true, decimals: 1, style: '$' }),
    }),
    [token.price, token.price.relativeChange24h, token.market.volume.h24, token.market.marketCap]
  );

  const onPress = useCallback(() => {
    navigate(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: token,
      address: token.address,
      chainId: token.chainID,
    });
  }, [navigate, token]);

  return (
    <SkiaCard
      height={84}
      width={cardWidth}
      onPress={onPress}
      // shadowColor={CARD_PROPS.shadowColor}
      borderRadius={32}
      skiaBackground={<Group />}
      skiaForeground={
        <Group>
          <Image fit="cover" height={84} image={coinIconImage} opacity={1} width={cardWidth} x={0} y={0} />
          <Blur blur={CARD_CONFIG.backgroundBlur.radius} />
        </Group>
      }
      foregroundComponent={
        <Box width="full" height="full" justifyContent="center" paddingVertical={'16px'} paddingHorizontal={'20px'}>
          <Inline wrap={false} alignVertical="center" space={'12px'}>
            <Box justifyContent="center" alignItems="center" width={48} height={48}>
              {sizedIconUrl && <ShinyCoinIcon imageUrl={sizedIconUrl} size={40} />}
              <Box
                // shadow={'24px red'}
                position="absolute"
                borderRadius={24}
                width={48}
                height={48}
                borderWidth={2}
                borderColor={{ custom: token.colors.primary }}
              />
              <Text
                color="label"
                size="20pt"
                weight="bold"
                style={{ position: 'absolute', top: -7.5, left: 10, transform: [{ rotate: '-2deg' }] }}
              >
                {'👑'}
              </Text>
            </Box>
            <Box style={{ flex: 1 }} gap={12}>
              <Inline wrap={false} alignVertical="center" alignHorizontal="justify" space={'8px'}>
                <TextShadow blur={8} shadowOpacity={0.24} color={token.colors.primary}>
                  <Text color={{ custom: token.colors.primary }} size="11pt" weight="black">
                    {i18n.t(i18n.l.king_of_hill.current_king)}
                  </Text>
                </TextShadow>
                <AnimatedCountdownText targetUnixTimestamp={1744872044} />
              </Inline>
              <Inline wrap={false} alignHorizontal="justify" space={'8px'}>
                <Box style={{ flex: 1 }} flexDirection="row" alignItems="center" gap={6}>
                  <Text numberOfLines={1} ellipsizeMode="tail" color="label" size="17pt" weight="heavy" style={{ flexShrink: 1 }}>
                    {token.symbol}
                  </Text>
                  <Box flexDirection="row" alignItems="center" gap={3}>
                    <Text color={hasTokenPriceIncreased ? 'green' : 'red'} size="11pt" weight="bold">
                      {hasTokenPriceIncreased ? '􀄨' : '􀄩'}
                    </Text>
                    <Text color={hasTokenPriceIncreased ? 'green' : 'red'} size="15pt" weight="bold">
                      {priceChange24h}
                    </Text>
                  </Box>
                </Box>
                <Text color="label" size="17pt" weight="heavy">
                  {price}
                </Text>
              </Inline>
              <Inline
                wrap={false}
                alignHorizontal="left"
                horizontalSpace="8px"
                alignVertical="center"
                separator={<Box width={1} height={'full'} backgroundColor={separatorColor} />}
              >
                <Inline space="4px">
                  <Text color="labelQuaternary" size="11pt" weight="bold">
                    {i18n.t(i18n.l.market_data.vol)}
                  </Text>
                  <Text color="labelTertiary" size="11pt" weight="bold">
                    {volume}
                  </Text>
                </Inline>
                <Inline space="4px">
                  <Text color="labelQuaternary" size="11pt" weight="bold">
                    {i18n.t(i18n.l.market_data.mcap)}
                  </Text>
                  <Text color="labelTertiary" size="11pt" weight="bold">
                    {marketCap}
                  </Text>
                </Inline>
              </Inline>
            </Box>
          </Inline>
        </Box>
      }
    />
  );
}

function LastWinnerSection({ lastWinnerToken }: { lastWinnerToken: KingOfTheHillToken }) {
  const { navigate } = useNavigation();
  const { isDarkMode } = useColorMode();
  const sizedIconUrl = getSizedImageUrl(lastWinnerToken.iconUrl, 16);

  const navigateToLastWinner = useCallback(() => {
    navigate(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: lastWinnerToken,
      address: lastWinnerToken.address,
      chainId: lastWinnerToken.chainID,
    });
  }, [lastWinnerToken, navigate]);

  return (
    <Box flexDirection="row" justifyContent="space-between" paddingHorizontal={'10px'}>
      <ButtonPressAnimation onPress={navigateToLastWinner}>
        <GradientBorderView
          borderGradientColors={['rgba(245,248,255,0.08)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          borderRadius={13}
          backgroundColor={isDarkMode ? globalColors.grey100 : '#FBFCFD'}
          style={{ height: 26 }}
        >
          <Box height="full" justifyContent="center" paddingLeft={'10px'} paddingRight={{ custom: 5 }}>
            <Inline alignVertical="center" space={'6px'}>
              <Text color="labelQuaternary" size="11pt" weight="bold">
                {i18n.t(i18n.l.king_of_hill.last_winner)}
              </Text>
              <Box height={16} width={1} backgroundColor={isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR} />
              <Text color="labelTertiary" size="11pt" weight="heavy">
                {lastWinnerToken.symbol}
              </Text>
              <FastImage source={{ uri: sizedIconUrl }} style={{ width: 16, height: 16, borderRadius: 8 }} />
            </Inline>
          </Box>
        </GradientBorderView>
      </ButtonPressAnimation>
      <ButtonPressAnimation
        onPress={() => {
          // TODO: need a how it works sheet
        }}
      >
        <GradientBorderView
          borderGradientColors={['rgba(245,248,255,0.08)', 'rgba(0,0,0,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          borderRadius={13}
          backgroundColor={isDarkMode ? globalColors.grey100 : '#FBFCFD'}
          style={{ height: 26 }}
        >
          <Box height="full" justifyContent="center" paddingHorizontal={'10px'}>
            <Text color="labelQuaternary" size="13pt" weight="bold">
              {i18n.t(i18n.l.king_of_hill.how_it_works)}
            </Text>
          </Box>
        </GradientBorderView>
      </ButtonPressAnimation>
    </Box>
  );
}

export function KingOfHillSection() {
  const kingOfTheHill = useKingOfTheHillStore(store => store.getData());

  if (!kingOfTheHill) {
    return null;
  }

  return (
    <Box gap={6}>
      <LastWinnerSection lastWinnerToken={kingOfTheHill.lastWinner.token} />
      <KingOfHillCard king={kingOfTheHill.currentKing} />
    </Box>
  );
}
