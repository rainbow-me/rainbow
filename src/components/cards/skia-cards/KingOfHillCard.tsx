import React, { useCallback, useMemo } from 'react';
import { useDimensions } from '@/hooks';
import { SkiaCard, SkiaCardProps } from './SkiaCard';
import { BlendColor, Blur, Group, Paint, Image, useImage, vec, RoundedRect, rect, Rect } from '@shopify/react-native-skia';
import LinearGradient from 'react-native-linear-gradient';
import { Box, globalColors, Inline, Separator, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { opacity } from '@/__swaps__/utils/swaps';
import { ShinyCoinIcon } from '@/components/coin-icon/ShinyCoinIcon';
import { formatCurrency, formatNumber } from '@/helpers/strings';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import FastImage from 'react-native-fast-image';
import { getSizedImageUrl } from '@/handlers/imgix';
import MaskedView from '@react-native-masked-view/masked-view';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

// TODO: Test data, replace with requests when available
const token = {
  address: '0x348c4395f04b19ad2a26c3b450bb265fd0d063c7',
  chainId: '8453',
  name: 'Token',
  symbol: 'BABYDENGBABY',
  iconUrl: 'https://rainbowme-res.cloudinary.com/image/upload/v1740085064/token-launcher/tokens/qa1okeas3qkofjdbbrgr.jpg',
  colors: {
    primary: 'orange',
    secondary: 'red',
    shadow: 'blue',
  },
  price: {
    value: 0.00032,
    relativeChange24h: 35.23,
  },
};

const kingOfHillData = {
  currentKing: {
    token: token,
    window: {
      start: 1718217600000,
      end: 1718217600000,
    },
    marketStats: {
      '24hVol': 123123,
    },
    kingSince: 1718217600000,
  },
  lastWinner: {
    token: {
      ...token,
      symbol: 'ZUMI',
    },
    window: {
      start: 1718217600000,
      end: 1718217600000,
    },
  },
};

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

function KingOfHillCard({ king }: { king: KingOfHillKing }) {
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
      marketCap: formatNumber(100_412, { useOrderSuffix: true, decimals: 1, style: '$' }),
      price: formatCurrency(token.price.value),
      priceChange24h: `${formatNumber(token.price.relativeChange24h, { decimals: 2, useOrderSuffix: true })}%`,
      volume: formatNumber(king.marketStats['24hVol'], { useOrderSuffix: true, decimals: 1, style: '$' }),
    }),
    [token.price, token.price.relativeChange24h, king.marketStats['24hVol']]
  );

  const onPress = useCallback(() => {
    navigate(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: token,
      address: token.address,
      chainId: token.chainId,
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
              <Text color="label" size="11pt" weight="black">
                {'CURRENT KING'}
              </Text>
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
                    {'VOL'}
                  </Text>
                  <Text color="labelTertiary" size="11pt" weight="bold">
                    {volume}
                  </Text>
                </Inline>
                <Inline space="4px">
                  <Text color="labelQuaternary" size="11pt" weight="bold">
                    {'MCAP'}
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

function LastWinnerSection({ lastWinnerToken }: { lastWinnerToken: KingOfHillKing['token'] }) {
  const { navigate } = useNavigation();
  const { isDarkMode } = useColorMode();
  const sizedIconUrl = getSizedImageUrl(lastWinnerToken.iconUrl, 16);

  const navigateToLastWinner = useCallback(() => {
    navigate(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: lastWinnerToken,
      address: lastWinnerToken.address,
      chainId: lastWinnerToken.chainId,
    });
  }, [lastWinnerToken, navigate]);

  return (
    <Box flexDirection="row" justifyContent="space-between" paddingHorizontal={'10px'}>
      <ButtonPressAnimation onPress={navigateToLastWinner}>
        <Box
          height={26}
          borderRadius={13}
          justifyContent="center"
          alignItems="center"
          paddingLeft={'10px'}
          paddingRight={{ custom: 5 }}
          borderWidth={THICK_BORDER_WIDTH}
        >
          <Inline alignVertical="center" space={'6px'}>
            <Text color="labelQuaternary" size="11pt" weight="bold">
              {'Last Winner'}
            </Text>
            <Box height={16} width={1} backgroundColor={isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR} />
            <Text color="labelTertiary" size="11pt" weight="heavy">
              {lastWinnerToken.symbol}
            </Text>
            <FastImage source={{ uri: sizedIconUrl }} style={{ width: 16, height: 16, borderRadius: 8 }} />
          </Inline>
        </Box>
      </ButtonPressAnimation>
      <Box
        height={26}
        borderRadius={13}
        borderWidth={THICK_BORDER_WIDTH}
        justifyContent="center"
        alignItems="center"
        paddingHorizontal={'10px'}
      >
        <Text color="labelQuaternary" size="13pt" weight="bold">
          {'How it Works'}
        </Text>
      </Box>
    </Box>
  );
}

export function KingOfHillSection() {
  return (
    <Box gap={6}>
      <LastWinnerSection lastWinnerToken={kingOfHillData.lastWinner.token} />
      <KingOfHillCard king={kingOfHillData.currentKing} />
    </Box>
  );
}
