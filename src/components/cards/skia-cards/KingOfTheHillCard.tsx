import React, { useCallback, useMemo } from 'react';
import * as i18n from '@/languages';
import { useDimensions } from '@/hooks';
import { SkiaCard } from './SkiaCard';
import { Blur, Group, Image, Paint, useImage } from '@shopify/react-native-skia';
import { AnimatedText, Box, ColorModeProvider, globalColors, Inline, Text, TextShadow } from '@/design-system';
import { ShinyCoinIcon } from '@/components/coin-icon/ShinyCoinIcon';
import { formatCurrency, formatNumber } from '@/helpers/strings';
import { getSizedImageUrl } from '@/handlers/imgix';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useDerivedValue } from 'react-native-reanimated';
import { useAnimatedCountdown } from '@/hooks/reanimated/useAnimatedCountdown';
import { KingOfTheHillToken } from '@/graphql/__generated__/metadata';

const CARD_HEIGHT = 84;
const startingNextRoundText = i18n.t(i18n.l.king_of_hill.starting_next_round);
const leftText = i18n.t(i18n.l.king_of_hill.left);

function AnimatedCountdownText({ targetUnixTimestamp, color }: { targetUnixTimestamp: number; color: string }) {
  const countdown = useAnimatedCountdown(targetUnixTimestamp);

  const timeString = useDerivedValue(() => {
    if (countdown.value === '00:00:00') return startingNextRoundText;
    return `${countdown.value} ${leftText}`;
  });

  return (
    <TextShadow blur={8} shadowOpacity={0.24} color={color}>
      <AnimatedText color={{ custom: color }} tabularNumbers size="11pt" weight="heavy">
        {timeString}
      </AnimatedText>
    </TextShadow>
  );
}

export function KingOfTheHillCard({ king }: { king: KingOfTheHillToken }) {
  const { token } = king;
  const coinIconImage = useImage(token.iconUrl);

  const { width } = useDimensions();
  const cardWidth = width - 20 * 2;
  const hasTokenPriceIncreased = Number(token.price.relativeChange24h) > 0;
  const priceColor = hasTokenPriceIncreased ? 'green' : 'red';
  const sizedIconUrl = getSizedImageUrl(token.iconUrl, 40);
  const primaryColor = token.colors.primary;

  const { marketCap, price, priceChange24h, volume } = useMemo(
    () => ({
      marketCap: formatNumber(token.marketCap ?? 0, { useOrderSuffix: true, decimals: 1, style: '$' }),
      price: formatCurrency(token.price.value ?? 0),
      priceChange24h: `${formatNumber(token.price.relativeChange24h ?? 0, { decimals: 2, useOrderSuffix: true })}%`,
      volume: formatNumber(token.marketData?.volume24h ?? 0, { useOrderSuffix: true, decimals: 1, style: '$' }),
    }),
    [token.marketCap, token.price, token.marketData]
  );

  const onPress = useCallback(() => {
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: token,
      address: token.address,
      chainId: token.chainId,
    });
  }, [token]);

  return (
    <SkiaCard
      height={CARD_HEIGHT}
      width={cardWidth}
      onPress={onPress}
      borderRadius={32}
      skiaBackground={<Paint antiAlias dither color={'rgba(245,248,255,0.08)'} />}
      strokeOpacity={{ start: 0.05, end: 0.02 }}
      innerShadowOpacity={{ dark: 0.2, light: 0.2 }}
      skiaForeground={
        <Group>
          <Image fit="cover" height={CARD_HEIGHT} image={coinIconImage} opacity={0.5} width={cardWidth} x={-40} y={0} />
          <Blur blur={128 / 2} />
        </Group>
      }
      foregroundComponent={
        <ColorModeProvider value={'dark'}>
          <Box width="full" height="full" justifyContent="center" paddingVertical={'16px'} paddingHorizontal={'20px'}>
            <Inline wrap={false} alignVertical="center" space={'12px'}>
              <Box justifyContent="center" alignItems="center" width={48} height={48}>
                {sizedIconUrl && <ShinyCoinIcon imageUrl={sizedIconUrl} size={40} color={primaryColor} />}
                <Box position="absolute" borderRadius={24} width={48} height={48} borderWidth={2} borderColor={{ custom: primaryColor }} />
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
                  <TextShadow blur={8} shadowOpacity={0.24} color={primaryColor}>
                    <Text color={{ custom: primaryColor }} size="11pt" weight="black">
                      {i18n.t(i18n.l.king_of_hill.current_king)}
                    </Text>
                  </TextShadow>
                  <AnimatedCountdownText targetUnixTimestamp={king.window.end} color={primaryColor} />
                </Inline>
                <Inline wrap={false} alignHorizontal="justify" space={'8px'}>
                  <Box style={{ flex: 1 }} flexDirection="row" alignItems="center" gap={6}>
                    <Text numberOfLines={1} ellipsizeMode="tail" color="label" size="17pt" weight="heavy" style={{ flexShrink: 1 }}>
                      {token.symbol}
                    </Text>
                    <Box flexDirection="row" alignItems="center" gap={3}>
                      <Text color={priceColor} size="11pt" weight="bold">
                        {hasTokenPriceIncreased ? '􀄨' : '􀄩'}
                      </Text>
                      <Text color={priceColor} size="15pt" weight="bold">
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
                  separator={<Box width={1} height={'full'} backgroundColor={globalColors.white20} />}
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
        </ColorModeProvider>
      }
    />
  );
}
