import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { CARET_SYMBOL } from '@/components/king-of-the-hill/constants';
import { GradientBorderContent } from '@/components/king-of-the-hill/GradientBorderContent';
import { Text, useColorMode } from '@/design-system';
import { KingOfTheHill } from '@/graphql/__generated__/metadata';
import { getSizedImageUrl } from '@/handlers/imgix';
import { formatCurrency } from '@/helpers/strings';
import { abbreviateNumber } from '@/helpers/utilities';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { fetchAndSetEnsData } from '@/screens/Airdrops/ClaimAirdropSheet';
import { formatAddressForDisplay } from '@/utils/abbreviations';
import { Canvas, Circle, LinearGradient, vec } from '@shopify/react-native-skia';
import React, { memo, useEffect, useLayoutEffect, useState } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSharedValue } from 'react-native-reanimated';
import { Address } from 'viem';
import crownImage from './crown.png';
import { HeaderButton } from './HeaderButton';
import { RainbowGlow } from './RainbowGlow';
import { formatPriceChange, getPriceChangeColor } from './utils';

type HeaderProps = {
  kingOfTheHill?: KingOfTheHill | null;
  onColorExtracted?: (color: string | null) => void;
};

const TOKEN_SIZE = 80;

export function KingOfTheHillHeader({ kingOfTheHill, onColorExtracted }: HeaderProps) {
  const { isDarkMode } = useColorMode();
  const current = kingOfTheHill?.current;
  const lastWinner = kingOfTheHill?.lastWinner;
  const { token } = current || {};
  const { width: deviceWidth } = useWindowDimensions();

  const navigateToLastWinner = () => {
    if (!lastWinner) return;
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: lastWinner.token,
      address: lastWinner.token.address,
      chainId: lastWinner.token.chainId,
    });
  };

  const navigateToExplainSheet = () => {
    Navigation.handleAction(Routes.KING_OF_THE_HILL_EXPLAIN_SHEET);
  };

  const navigateToToken = () => {
    if (!token) return;
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: token,
      address: token.address,
      chainId: token.chainId,
    });
  };

  const sizedIconUrl = getSizedImageUrl(token?.iconUrl, 160);
  const lastWinnerIconUrl = lastWinner ? getSizedImageUrl(lastWinner.token.iconUrl, 16) : null;

  const dominantColor = usePersistentDominantColorFromImage(sizedIconUrl);

  const initialSecondsRemaining = current?.window?.secondsRemaining || 0;
  const [secondsRemaining, setSecondsRemaining] = useState(initialSecondsRemaining);

  useLayoutEffect(() => {
    if (onColorExtracted && dominantColor) {
      onColorExtracted(dominantColor);
    }
  }, [dominantColor, onColorExtracted]);

  useEffect(() => {
    setSecondsRemaining(initialSecondsRemaining);
  }, [initialSecondsRemaining]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 60));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!current) {
    return null;
  }

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const timeRemaining = `${hours}h ${minutes}m`;

  if (!token) {
    return null;
  }

  // Get actual price data from token
  const priceChange = formatPriceChange(token.price?.relativeChange24h);

  const currentPrice = token.price?.value ? formatCurrency(token.price.value) : 'N/A';

  // Get volume from ranking details
  const volumeValue = current.rankingDetails?.windowTradingVolume;
  const volume = volumeValue ? `$${abbreviateNumber(parseFloat(volumeValue), 1)}` : 'N/A';

  // Get market cap from token
  const marketCapValue = token.marketCap;
  const marketCap = marketCapValue ? `$${abbreviateNumber(marketCapValue, 1)}` : 'N/A';

  // Get creator address
  const creatorAddress = token.rainbowTokenDetails?.onchainData?.creatorAddress;

  return (
    <View style={styles.headerContainer}>
      {/* Token circle */}
      <View style={styles.tokenImageContainer}>
        <View style={styles.glowContainer}>
          <RainbowGlow size={TOKEN_SIZE} />
        </View>

        {/* Gradient circle behind token */}
        <View style={styles.gradientCircleContainer}>
          <Canvas style={styles.gradientCanvas}>
            <Circle cx={(TOKEN_SIZE + 12) / 2} cy={(TOKEN_SIZE + 12) / 2} r={(TOKEN_SIZE + 12) / 2}>
              <LinearGradient
                start={vec((TOKEN_SIZE + 12) / 2, 0)}
                end={vec((TOKEN_SIZE + 12) / 2, TOKEN_SIZE + 12)}
                colors={[
                  'rgba(34, 197, 94, 1)', // green
                  'rgba(250, 204, 21, 1)', // yellow
                  'rgba(239, 68, 68, 1)', // red
                ]}
                positions={[0, 0.5, 1]}
              />
            </Circle>
          </Canvas>
        </View>

        <FastImage source={{ uri: sizedIconUrl }} style={styles.tokenImage} />

        {/* Chain image floating at bottom */}
        <View style={styles.chainImageContainer}>
          <ChainImage chainId={token.chainId} size={26} position="absolute" style={styles.chainImageShadow} />
        </View>

        <Image source={crownImage} style={styles.crown} />
      </View>

      {/* Round ends */}
      <View style={styles.roundEndsContainer}>
        <GradientBorderContent borderRadius={12} height={28}>
          <View style={styles.roundEndsContent}>
            <Text color="labelSecondary" size="13pt" weight="heavy">
              Round ends in {timeRemaining}
            </Text>
          </View>
        </GradientBorderContent>
      </View>

      {/* Symbol and price change */}
      <ButtonPressAnimation onPress={navigateToToken} scaleTo={0.96}>
        <View style={styles.symbolPriceContainer}>
          <Text color="label" size="20pt" weight="heavy">
            {token.symbol}
          </Text>
          <Text color={getPriceChangeColor(priceChange)} size="17pt" weight="bold">
            {priceChange}
          </Text>
          <Text color="labelQuaternary" size="icon 11px" weight="bold" style={styles.caretContainer}>
            {CARET_SYMBOL}
          </Text>
        </View>
      </ButtonPressAnimation>

      {/* Current price */}
      <Text color="label" size="30pt" weight="heavy" align="center" style={styles.currentPrice}>
        {currentPrice}
      </Text>

      {/* VOL | MCAP */}
      <View style={styles.statsContainer}>
        {creatorAddress && (
          <>
            <CreatorDisplay creatorAddress={creatorAddress} />
            <Separator />
          </>
        )}
        <View style={styles.statItem}>
          <Text color="labelQuaternary" size="13pt" weight="semibold">
            VOL
          </Text>
          <Text color="labelTertiary" size="13pt" weight="semibold">
            {volume}
          </Text>
        </View>
        <View style={[styles.separator, { backgroundColor: isDarkMode ? 'rgba(245, 248, 255, 0.08)' : 'rgba(9, 17, 31, 0.08)' }]} />
        <View style={styles.statItem}>
          <Text color="labelQuaternary" size="13pt" weight="semibold">
            MCAP
          </Text>
          <Text color="labelTertiary" size="13pt" weight="semibold">
            {marketCap}
          </Text>
        </View>
      </View>

      {/* Last winner and How it works buttons */}
      <View style={styles.buttonsContainer}>
        <HeaderButton onPress={lastWinner ? navigateToLastWinner : navigateToExplainSheet} iconUrl={lastWinner ? lastWinnerIconUrl : null}>
          {lastWinner && (
            // maxWidth = how it works 120px + last winner outer content 130px + side pad 20px * 2 + gap between 20px
            <View style={{ maxWidth: deviceWidth - (120 + 130 + 20 * 2 + 20), marginRight: 8 }}>
              <Text color="labelTertiary" size="13pt" weight="bold" ellipsizeMode="tail" numberOfLines={1}>
                {token.symbol}
              </Text>
            </View>
          )}
          <Text color="labelQuaternary" size="13pt" weight="bold">
            {lastWinner ? 'Last winner ' : 'No Previous Winner'}
          </Text>
        </HeaderButton>

        <HeaderButton onPress={navigateToExplainSheet}>
          <Text color="labelTertiary" size="13pt" weight="bold">
            How it works
          </Text>
        </HeaderButton>
      </View>

      {/* Separator */}
      <View style={[styles.bottomSeparator, { backgroundColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }]} />
    </View>
  );
}

const CreatorDisplay = memo(function CreatorDisplay({ creatorAddress }: { creatorAddress: string }) {
  const [creatorData, setCreatorData] = useState<{ ens: string | null; avatar: string | null }>({ ens: null, avatar: null });
  const ensOrAddress = useSharedValue<string | null | undefined>(undefined);
  const avatarUrl = useSharedValue<string | null | undefined>(undefined);

  useEffect(() => {
    const getEnsData = async () => {
      await fetchAndSetEnsData({ address: creatorAddress as Address, avatarUrl, ensOrAddress });
      setCreatorData({
        ens: ensOrAddress.value || null,
        avatar: avatarUrl.value || null,
      });
    };
    getEnsData();
  }, [creatorAddress, avatarUrl, ensOrAddress]);

  const displayName = creatorData.ens || formatAddressForDisplay(creatorAddress, 4, 4);

  return (
    <View style={styles.creatorDisplayContainer}>
      {creatorData.avatar && <FastImage source={{ uri: creatorData.avatar }} style={styles.creatorAvatar} />}
      <Text color="labelTertiary" size="11pt" weight="black">
        {displayName}
      </Text>
    </View>
  );
});

const Separator = () => {
  const { isDarkMode } = useColorMode();
  return <View style={[styles.separator, { backgroundColor: isDarkMode ? 'rgba(245, 248, 255, 0.08)' : 'rgba(9, 17, 31, 0.08)' }]} />;
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
  },
  creatorDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creatorAvatar: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
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
  gradientCircleContainer: {
    position: 'absolute',
    width: TOKEN_SIZE + 12,
    height: TOKEN_SIZE + 12,
    zIndex: 1,
  },
  gradientCanvas: {
    width: TOKEN_SIZE + 12,
    height: TOKEN_SIZE + 12,
  },
  crown: {
    position: 'absolute',
    top: 7,
    left: TOKEN_SIZE / 2 + 20,
    width: 35,
    height: 35,
    transform: [{ rotate: '-3deg' }],
    zIndex: 10,
  },
  chainImageContainer: {
    position: 'absolute',
    bottom: TOKEN_SIZE / 2 - 9,
    left: TOKEN_SIZE / 2 - 8,
    zIndex: 3,
  },
  chainImageShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  roundEndsContainer: {
    alignSelf: 'center',
    marginTop: -10,
    height: 32,
  },
  roundEndsContent: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
  },
  symbolPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  caretContainer: {
    marginLeft: 0,
  },
  currentPrice: {
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  separator: {
    width: 1,
    height: 10,
  },
  statItem: {
    flexDirection: 'row',
    gap: 4,
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginTop: 26,
  },
  bottomSeparator: {
    width: '100%',
    height: 1,
    marginTop: 16,
  },
});
