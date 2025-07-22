import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import CaretRightIcon from '@/components/icons/svg/CaretRightIcon';
import { Text, useBackgroundColor, useColorMode } from '@/design-system';
import { KingOfTheHill } from '@/graphql/__generated__/metadata';
import { getSizedImageUrl } from '@/handlers/imgix';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Canvas, Circle, LinearGradient, vec } from '@shopify/react-native-skia';
import React, { useLayoutEffect, useState, useEffect, memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { abbreviateNumber } from '@/helpers/utilities';
import crownImage from './crown.png';
import FireIcon from './FireIcon';
import { HeaderButton } from './HeaderButton';
import { RainbowGlow } from './RainbowGlow';
import { Address } from 'viem';
import { formatAddressForDisplay } from '@/utils/abbreviations';
import { fetchAndSetEnsData } from '@/screens/Airdrops/ClaimAirdropSheet';
import { useSharedValue } from 'react-native-reanimated';

type HeaderProps = {
  kingOfTheHill?: KingOfTheHill | null;
  onColorExtracted?: (color: string | null) => void;
};

const TOKEN_SIZE = 80;

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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {creatorData.avatar && <FastImage source={{ uri: creatorData.avatar }} style={{ width: 14, height: 14, borderRadius: 7 }} />}
      <Text color="labelTertiary" size="11pt" weight="black">
        {displayName}
      </Text>
    </View>
  );
});

export function Header({ kingOfTheHill, onColorExtracted }: HeaderProps) {
  const { isDarkMode } = useColorMode();
  const gradientBorderColor = useBackgroundColor('fillTertiary');
  const current = kingOfTheHill?.current;
  const lastWinner = kingOfTheHill?.lastWinner;
  const { token } = current || {};

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

  useLayoutEffect(() => {
    if (onColorExtracted && dominantColor) {
      onColorExtracted(dominantColor);
    }
  }, [dominantColor, onColorExtracted]);

  if (!current) {
    return null;
  }

  const initialSecondsRemaining = current.window?.secondsRemaining || 0;
  const [secondsRemaining, setSecondsRemaining] = useState(initialSecondsRemaining);

  useEffect(() => {
    setSecondsRemaining(initialSecondsRemaining);
  }, [initialSecondsRemaining]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 60));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const timeRemaining = `${hours}h ${minutes}m`;

  if (!token) {
    return null;
  }

  // Get actual price data from token
  const priceChangeValue = token.price?.relativeChange24h || 0;
  const priceChange = priceChangeValue !== 0 ? `${priceChangeValue > 0 ? '↑' : ''}${(priceChangeValue * 100).toFixed(2)}%` : 'N/A';

  const currentPrice = token.price?.value
    ? `$${token.price.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
    : 'N/A';

  // Get volume from ranking details
  const volumeValue = current.rankingDetails?.windowTradingVolume;
  const volume = volumeValue ? `$${abbreviateNumber(parseFloat(volumeValue), 1)}` : 'N/A';

  // Get market cap from token
  const marketCapValue = token.marketCap;
  const marketCap = marketCapValue ? `$${abbreviateNumber(marketCapValue, 1)}` : 'N/A';

  // Get creator address
  const creatorAddress = token.rainbowTokenDetails?.onchainData?.creatorAddress;
  console.log('creatorAddress', creatorAddress);

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Token circle */}
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

        <View style={styles.fireIcon}>
          <FireIcon size={40} />
        </View>

        {/* Chain image floating at bottom */}
        <View style={styles.chainImageContainer}>
          <ChainImage chainId={token.chainId} size={26} position="absolute" style={styles.chainImageShadow} />
        </View>

        <Image source={crownImage} style={styles.crown} />
      </View>

      {/* Round ends */}
      <View style={{ alignSelf: 'center', marginTop: -12, height: 32 }}>
        <GradientBorderView
          borderGradientColors={[gradientBorderColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          borderRadius={12}
          backgroundColor={isDarkMode ? 'rgba(245, 248, 255, 0.02)' : 'rgba(9, 17, 31, 0.01)'}
          style={{ height: 28 }}
        >
          <View
            style={{
              paddingHorizontal: 16,
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 10 }}>
          <Text color="label" size="20pt" weight="bold">
            {token.symbol}
          </Text>
          <Text color={priceChange.startsWith('↑') ? 'green' : 'red'} size="20pt" weight="bold">
            {priceChange.slice(0, 1)} {priceChange.slice(1)}
          </Text>
          <View style={{ marginLeft: 0 }}>
            <CaretRightIcon color={isDarkMode ? '#999' : '#666'} width={8} height={10} />
          </View>
        </View>
      </ButtonPressAnimation>

      {/* Current price */}
      <Text color="label" size="30pt" weight="heavy" align="center" style={{ marginTop: 12 }}>
        {currentPrice}
      </Text>

      {/* Creator | VOL | MCAP */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 10 }}>
        {creatorAddress && (
          <>
            <CreatorDisplay creatorAddress={creatorAddress} />
            <View
              style={{
                width: 1,
                height: 10,
                backgroundColor: isDarkMode ? 'rgba(245, 248, 255, 0.08)' : 'rgba(9, 17, 31, 0.08)',
              }}
            />
          </>
        )}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Text color="labelQuaternary" size="13pt" weight="semibold">
            VOL
          </Text>
          <Text color="labelTertiary" size="13pt" weight="semibold">
            {volume}
          </Text>
        </View>
        <View
          style={{
            width: 1,
            height: 10,
            backgroundColor: isDarkMode ? 'rgba(245, 248, 255, 0.08)' : 'rgba(9, 17, 31, 0.08)',
          }}
        />
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Text color="labelQuaternary" size="13pt" weight="semibold">
            MCAP
          </Text>
          <Text color="labelTertiary" size="13pt" weight="semibold">
            {marketCap}
          </Text>
        </View>
      </View>

      {/* Last winner and How it works buttons */}
      <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 0, marginTop: 26 }}>
        <HeaderButton onPress={lastWinner ? navigateToLastWinner : navigateToExplainSheet} iconUrl={lastWinner ? lastWinnerIconUrl : null}>
          <Text color="labelQuaternary" size="13pt" weight="bold">
            {lastWinner ? 'Last winner ' : 'No Previous Winner'}
          </Text>
          {lastWinner && (
            <Text color="labelTertiary" size="13pt" weight="bold">
              {lastWinner.token.symbol}
            </Text>
          )}
        </HeaderButton>

        <HeaderButton onPress={navigateToExplainSheet}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text color="labelTertiary" size="13pt" weight="bold">
              How it works
            </Text>
            <CaretRightIcon color={isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'} width={6} height={8} />
          </View>
        </HeaderButton>
      </View>

      {/* Separator */}
      <View style={{ width: '100%', height: 1, backgroundColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR, marginTop: 16 }} />
    </View>
  );
}

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
    bottom: TOKEN_SIZE / 2 - 15,
    right: TOKEN_SIZE / 2 - 15,
    zIndex: 3,
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
});
