import { StyleSheet, View } from 'react-native';
import { Box, globalColors, Text, TextShadow, useColorMode } from '@/design-system';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { memo, useMemo } from 'react';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { LinearGradient } from 'react-native-linear-gradient';
import ImgixImage from '@/components/images/ImgixImage';
import { toPercentageWorklet } from '@/safe-math/SafeMath';
import { formatNumber } from '@/helpers/strings';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { formatPrice } from '@/features/polymarket/utils/formatPrice';
import { createOpacityPalette } from '@/worklets/colors';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

type MarketRowProps = {
  accentColor: string;
  priceChange: number | undefined;
  image?: string | undefined;
  title: string;
  volume?: string;
  tokenId: string;
  price: string;
  minTickSize: number;
  onPress: () => void;
};

const ROW_RIGHT_BLEED = 4;

export const MarketRow = memo(function MarketRow({
  accentColor,
  priceChange,
  image,
  title,
  volume,
  tokenId,
  price,
  minTickSize,
  onPress,
}: MarketRowProps) {
  const { isDarkMode } = useColorMode();

  const shouldShowPriceChange = priceChange !== undefined && Math.abs(priceChange) >= 0.01;
  const priceChangeIsPositive = priceChange !== undefined && priceChange > 0;

  const livePrice = useLiveTokenValue({
    tokenId: getPolymarketTokenId(tokenId, 'sell'),
    initialValue: price ? formatPrice(price, minTickSize) : '0',
    selector: token => formatPrice(token.price, minTickSize),
  });

  const priceChangePercentage = useMemo(() => {
    if (priceChange === undefined) return '';
    const roundedPriceChange = Math.round(priceChange * 100) / 100;
    return `${toPercentageWorklet(Math.abs(roundedPriceChange))}%`;
  }, [priceChange]);

  const accentColors = useMemo(() => {
    return createOpacityPalette(accentColor, [0, 3, 6, 8, 14, 16]);
  }, [accentColor]);

  return (
    <ButtonPressAnimation scaleTo={0.95} onPress={onPress}>
      <GradientBorderView
        borderGradientColors={
          isDarkMode ? [accentColors.opacity0, accentColors.opacity6] : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)']
        }
        borderWidth={isDarkMode ? 2.5 : THICKER_BORDER_WIDTH}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        borderRadius={24}
        style={{ height: 66, marginRight: -ROW_RIGHT_BLEED, overflow: 'hidden' }}
      >
        <LinearGradient
          colors={isDarkMode ? [accentColors.opacity0, accentColors.opacity14] : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.89)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          pointerEvents="none"
        />
        <Box flexDirection="row" alignItems="center" height="full" gap={12} paddingRight={'10px'}>
          {image && <ImgixImage enableFasterImage resizeMode="cover" size={40} source={{ uri: image }} style={styles.image} />}
          <Box gap={12} style={styles.flex}>
            <Box flexDirection="row" alignItems="center" gap={8}>
              <Text size="17pt" weight="bold" color="label" numberOfLines={1} style={styles.flexShrink}>
                {title}
              </Text>
              {shouldShowPriceChange && (
                <Box flexDirection="row" alignItems="center" gap={3}>
                  <Text
                    size="icon 8px"
                    weight="heavy"
                    color={priceChangeIsPositive ? 'green' : 'red'}
                    style={{ transform: priceChangeIsPositive ? [] : [{ rotate: '180deg' }] }}
                  >
                    {'􀛤'}
                  </Text>
                  <Text size="15pt" weight="heavy" color={priceChangeIsPositive ? 'green' : 'red'}>
                    {priceChangePercentage}
                  </Text>
                </Box>
              )}
            </Box>
            {volume !== undefined && (
              <Text size="15pt" weight="bold" color="labelSecondary">
                {formatNumber(volume, { useOrderSuffix: true, decimals: 1, style: '$' })}
              </Text>
            )}
          </Box>
          <Box
            borderRadius={16}
            paddingHorizontal={'12px'}
            paddingVertical={'6px'}
            alignItems="center"
            justifyContent="center"
            borderColor={{ custom: isDarkMode ? accentColors.opacity6 : accentColors.opacity3 }}
            borderWidth={isDarkMode ? 2.5 : THICKER_BORDER_WIDTH}
            height={46}
          >
            {isDarkMode && <InnerShadow borderRadius={16} color={accentColors.opacity16} blur={5} dx={0} dy={1} />}
            {isDarkMode ? (
              <LinearGradient
                colors={[accentColors.opacity16, accentColors.opacity8]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                pointerEvents="none"
              />
            ) : (
              <View style={StyleSheet.absoluteFill}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: accentColors.opacity14 }]} />
              </View>
            )}
            <TextShadow blur={20} shadowOpacity={0.6}>
              <Text size="26pt" weight="heavy" color={{ custom: accentColor }}>
                {`${toPercentageWorklet(livePrice, 0.001)}%`}
              </Text>
            </TextShadow>
          </Box>
        </Box>
      </GradientBorderView>
    </ButtonPressAnimation>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexShrink: {
    flexShrink: 1,
  },
  image: {
    height: 40,
    width: 40,
    borderRadius: 9,
  },
});
