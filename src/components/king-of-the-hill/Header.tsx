import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import CaretRightIcon from '@/components/icons/svg/CaretRightIcon';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { Text, useBackgroundColor, useColorMode } from '@/design-system';
import { KingOfTheHill } from '@/graphql/__generated__/metadata';
import { getSizedImageUrl } from '@/handlers/imgix';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import React, { useCallback, useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import crownImage from './crown.png';
import FireIcon from './FireIcon';
import { HeaderButton } from './HeaderButton';
import { RainbowGlow } from './RainbowGlow';
import { Canvas, Circle, LinearGradient, vec } from '@shopify/react-native-skia';

interface HeaderProps {
  kingOfTheHill?: KingOfTheHill | null;
  onColorExtracted?: (color: string | null) => void;
}

const TOKEN_SIZE = 80;

const styles = StyleSheet.create({
  tokenImage: {
    width: TOKEN_SIZE,
    height: TOKEN_SIZE,
    borderRadius: TOKEN_SIZE / 2,
    zIndex: 2,
  },
  tokenImageContainer: {
    position: 'relative',
    width: TOKEN_SIZE * 2,
    height: TOKEN_SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireIcon: {
    position: 'absolute',
    bottom: TOKEN_SIZE / 2 - 13,
    right: TOKEN_SIZE / 2 - 15,
    zIndex: 3,
  },
  crown: {
    position: 'absolute',
    top: 15,
    left: TOKEN_SIZE / 2 + 15,
    width: 40,
    height: 40,
    transform: [{ rotate: '-3deg' }],
    zIndex: 10,
  },
});

export function Header({ kingOfTheHill, onColorExtracted }: HeaderProps) {
  const { isDarkMode } = useColorMode();
  const fillTertiaryColor = useBackgroundColor('fillTertiary');
  const current = kingOfTheHill?.current;
  const lastWinner = kingOfTheHill?.lastWinner;
  const { token } = current || {};

  const navigateToLastWinner = useCallback(() => {
    if (!lastWinner) return;
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: lastWinner.token,
      address: lastWinner.token.address,
      chainId: lastWinner.token.chainId,
    });
  }, [lastWinner]);

  const navigateToExplainSheet = useCallback(() => {
    Navigation.handleAction(Routes.KING_OF_THE_HILL_EXPLAIN_SHEET);
  }, []);

  const navigateToToken = useCallback(() => {
    if (!token) return;
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: token,
      address: token.address,
      chainId: token.chainId,
    });
  }, [token]);

  const sizedIconUrl = getSizedImageUrl(token?.iconUrl, 160);
  const lastWinnerIconUrl = lastWinner ? getSizedImageUrl(lastWinner.token.iconUrl, 16) : null;

  // Extract dominant color from token image
  const dominantColor = usePersistentDominantColorFromImage(sizedIconUrl);

  // Pass color to parent
  useEffect(() => {
    if (onColorExtracted && dominantColor) {
      onColorExtracted(dominantColor);
    }
  }, [dominantColor, onColorExtracted]);

  if (!current) {
    return null;
  }

  // Calculate time remaining from window data
  const secondsRemaining = current.window?.secondsRemaining || 0;
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const timeRemaining = `${hours}h ${minutes}m`;

  if (!token) {
    return null;
  }

  // Get actual price data from token
  const priceChangeValue = token.price?.relativeChange24h || 0;
  const priceChange = priceChangeValue !== 0 ? `${priceChangeValue > 0 ? '+' : ''}${(priceChangeValue * 100).toFixed(2)}%` : 'N/A';

  const currentPrice = token.price?.value
    ? `$${token.price.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
    : 'N/A';

  // Get volume from ranking details
  const volumeValue = current.rankingDetails?.windowTradingVolume;
  const volume = volumeValue ? `$${(parseFloat(volumeValue) / 1000000).toFixed(1)}M` : 'N/A';

  // Get market cap from token
  const marketCapValue = token.marketCap;
  const marketCap = marketCapValue ? `$${(marketCapValue / 1000000).toFixed(1)}M` : 'N/A';

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={styles.tokenImageContainer}>
        <View style={styles.glowContainer}>
          <RainbowGlow size={TOKEN_SIZE} />
        </View>
        
        {/* Gradient circle behind token */}
        <View style={{ position: 'absolute', width: TOKEN_SIZE + 12, height: TOKEN_SIZE + 12, zIndex: 1 }}>
          <Canvas style={{ width: TOKEN_SIZE + 12, height: TOKEN_SIZE + 12 }}>
            <Circle cx={(TOKEN_SIZE + 12) / 2} cy={(TOKEN_SIZE + 12) / 2} r={(TOKEN_SIZE + 12) / 2}>
              <LinearGradient
                start={vec((TOKEN_SIZE + 12) / 2, 0)}
                end={vec((TOKEN_SIZE + 12) / 2, TOKEN_SIZE + 12)}
                colors={[
                  'rgba(34, 197, 94, 1)',   // green
                  'rgba(250, 204, 21, 1)',  // yellow
                  'rgba(239, 68, 68, 1)',   // red
                ]}
                positions={[0, 0.5, 1]}
              />
            </Circle>
          </Canvas>
        </View>
        
        <FastImage source={{ uri: sizedIconUrl }} style={styles.tokenImage} />
        <View style={styles.fireIcon}>
          <FireIcon size={36} />
        </View>

        <Image source={crownImage} style={styles.crown} />
      </View>

      <View style={{ alignSelf: 'center', marginTop: -19, height: 32 }}>
        <GradientBorderView
          borderGradientColors={[fillTertiaryColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          borderRadius={12}
          backgroundColor={isDarkMode ? 'rgba(245, 248, 255, 0.02)' : 'rgba(9, 17, 31, 0.01)'}
          style={{ height: 32 }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              height: '100%',
              justifyContent: 'center',
            }}
          >
            <Text color="labelSecondary" size="13pt" weight="bold">
              Round ends in {timeRemaining}
            </Text>
          </View>
        </GradientBorderView>
      </View>

      {/* Symbol and price change */}
      <ButtonPressAnimation onPress={navigateToToken} scaleTo={0.96}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
          <Text color="label" size="17pt" weight="bold">
            {token.symbol}
          </Text>
          <Text color={priceChange.startsWith('+') ? 'green' : 'red'} size="17pt" weight="bold" style={{ marginLeft: 8 }}>
            {priceChange}
          </Text>
          <View style={{ marginLeft: 4 }}>
            <CaretRightIcon color={isDarkMode ? '#999' : '#666'} width={8} height={16} />
          </View>
        </View>
      </ButtonPressAnimation>

      {/* Current price */}
      <Text color="label" size="26pt" weight="heavy" align="center" style={{ marginTop: 16 }}>
        {currentPrice}
      </Text>

      {/* VOL | MCAP row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
        <Text color="labelTertiary" size="13pt" weight="semibold">
          VOL {volume}
        </Text>
        <View
          style={{
            width: 1,
            height: 16,
            backgroundColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR,
            marginHorizontal: 12,
          }}
        />
        <Text color="labelTertiary" size="13pt" weight="semibold">
          MCAP {marketCap}
        </Text>
      </View>

      {/* Last winner and How it works buttons */}
      <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 16 }}>
        <HeaderButton
          onPress={lastWinner ? navigateToLastWinner : navigateToExplainSheet}
          iconUrl={lastWinner ? lastWinnerIconUrl : null}
          text={lastWinner ? `${lastWinner.token.symbol} Last Winner` : 'No Previous Winner'}
        />

        <HeaderButton onPress={navigateToExplainSheet} text="How it works" />
      </View>

      {/* Separator */}
      <View style={{ width: '100%', height: 1, backgroundColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR, marginTop: 16 }} />
    </View>
  );
}
