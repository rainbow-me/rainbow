import React, { useCallback } from 'react';
import { useDimensions } from '@/hooks';
import { SkiaCard, SkiaCardProps } from './SkiaCard';
import { BlendColor, Blur, Group, LinearGradient, Paint, Image, useImage, vec, RoundedRect, rect, Rect } from '@shopify/react-native-skia';
import { Box, globalColors, Inline, Separator, Text } from '@/design-system';
import { opacity } from '@/__swaps__/utils/swaps';
import { ShinyCoinIcon } from '@/components/coin-icon/ShinyCoinIcon';

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
    color: {
      primary: string;
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
  const { token } = king;
  const coinIconImage = useImage(king.token.iconUrl);

  const { width } = useDimensions();

  const onPress = useCallback(() => {
    console.log('onPress');
  }, []);

  const cardWidth = width - 20 * 2;

  return (
    <SkiaCard
      height={84}
      width={cardWidth}
      onPress={onPress}
      // shadowColor={CARD_PROPS.shadowColor}
      borderRadius={32}
      skiaBackground={<Group></Group>}
      skiaForeground={
        <Group>
          <Image fit="cover" height={84} image={coinIconImage} opacity={1} width={cardWidth} x={0} y={0} />
          <Blur blur={CARD_CONFIG.backgroundBlur.radius} />
        </Group>
      }
      foregroundComponent={
        <Box width="full" height="full" justifyContent="center" paddingVertical={'16px'} paddingHorizontal={'20px'}>
          <Inline alignVertical="center" space={'12px'}>
            <Box justifyContent="center" alignItems="center" width={48} height={48}>
              <ShinyCoinIcon imageUrl={token.iconUrl} size={40} />
              <Box
                // shadow={'24px red'}
                position="absolute"
                borderRadius={24}
                width={48}
                height={48}
                borderWidth={2}
                borderColor={'green'}
              ></Box>
            </Box>
            <Box flexGrow={1} gap={12}>
              <Text color="label" size="11pt" weight="black">
                {'CURRENT KING'}
              </Text>
              <Inline>
                <Box flexGrow={1} flexDirection="row" alignItems="center" gap={6}>
                  <Text color="label" size="17pt" weight="heavy">
                    {token.symbol}
                  </Text>
                  <Box flexDirection="row" alignItems="center" gap={3}>
                    <Text color="label" size="11pt" weight="bold">
                      {'􀄨'}
                    </Text>
                    <Text color="label" size="15pt" weight="bold">
                      {'1.23%'}
                    </Text>
                  </Box>
                </Box>
                <Text color="label" size="17pt" weight="heavy">
                  {'$0.0231'}
                </Text>
              </Inline>
              <Inline
                wrap={false}
                alignHorizontal="left"
                horizontalSpace="8px"
                alignVertical="center"
                // separator={<Separator color={'separator'} direction="vertical" thickness={1} />}
              >
                <Inline space="4px">
                  <Text color="labelQuaternary" size="11pt" weight="bold">
                    {'VOL'}
                  </Text>
                  <Text color="labelTertiary" size="11pt" weight="bold">
                    {'$2.3k'}
                  </Text>
                </Inline>
                <Inline space="4px">
                  <Text color="labelQuaternary" size="11pt" weight="bold">
                    {'MCAP'}
                  </Text>
                  <Text color="labelTertiary" size="11pt" weight="bold">
                    {'$158.4k'}
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

export function KingOfHillSection() {
  const token = {
    address: '0x0000000000000000000000000000000000000000',
    chainId: '1',
    name: 'Token',
    symbol: 'TKN',
    iconUrl: 'https://rainbowme-res.cloudinary.com/image/upload/v1740085064/token-launcher/tokens/qa1okeas3qkofjdbbrgr.jpg',
    color: {
      primary: 'red',
    },
    price: {
      value: 1,
      relativeChange24h: 1.23,
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
      token: token,
      window: {
        start: 1718217600000,
        end: 1718217600000,
      },
    },
  };

  return (
    <Box>
      <KingOfHillCard king={kingOfHillData.currentKing} />
    </Box>
  );
}
