import { ButtonPressAnimation } from '@/components/animations';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ShinyCoinIcon } from '@/components/coin-icon/ShinyCoinIcon';
import { CHEVRON_RIGHT_SYMBOL } from '@/components/king-of-the-hill/constants';
import { GradientBorderContent } from '@/components/king-of-the-hill/GradientBorderContent';
import { Separator, Text } from '@/design-system';
import { KingOfTheHill } from '@/graphql/__generated__/metadata';
import { getSizedImageUrl } from '@/handlers/imgix';
import { formatCurrency } from '@/helpers/strings';
import { abbreviateNumber } from '@/helpers/utilities';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { fetchAndSetEnsData } from '@/screens/Airdrops/ClaimAirdropSheet';
import { time } from '@/utils';
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

const TOKEN_SIZE = 82;
const TOKEN_GRADIENT_BORDER_SIZE = TOKEN_SIZE + 14;
const SECONDS_PER_HOUR = 60 * 60;

export const KingOfTheHillHeader = memo(function KingOfTheHillHeader({ kingOfTheHill, onColorExtracted }: HeaderProps) {
  const current = kingOfTheHill?.current;
  const lastWinner = kingOfTheHill?.lastWinner;

  const { token: currentWinningToken } = current || {};
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
    if (!currentWinningToken) return;
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: currentWinningToken,
      address: currentWinningToken.address,
      chainId: currentWinningToken.chainId,
    });
  };

  const sizedIconUrl = getSizedImageUrl(currentWinningToken?.iconUrl, 160);
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

  // update time remaining every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 60));
    }, time.minutes(1));

    return () => clearInterval(interval);
  }, []);

  if (!current || !sizedIconUrl || !currentWinningToken) {
    return null;
  }

  const hours = Math.floor(secondsRemaining / SECONDS_PER_HOUR);
  const minutes = Math.floor((secondsRemaining % SECONDS_PER_HOUR) / 60);
  const timeRemaining = `${hours}h ${minutes}m`;

  const priceChange = formatPriceChange(currentWinningToken.price?.relativeChange24h);
  const currentPrice = currentWinningToken.price?.value ? formatCurrency(currentWinningToken.price.value) : 'N/A';

  const volumeValue = current.rankingDetails?.windowTradingVolume;
  const volume = volumeValue ? `$${abbreviateNumber(parseFloat(volumeValue), 1)}` : 'N/A';

  const marketCapValue = currentWinningToken.marketCap;
  const marketCap = marketCapValue ? `$${abbreviateNumber(marketCapValue, 1)}` : 'N/A';

  const creatorAddress = currentWinningToken.rainbowTokenDetails?.onchainData?.creatorAddress;

  return (
    <View style={styles.headerContainer}>
      {/* token circle */}
      <ButtonPressAnimation onPress={navigateToToken}>
        <View style={styles.tokenImageContainer}>
          <View style={styles.glowContainer}>
            <RainbowGlow size={TOKEN_SIZE} />
          </View>

          {/* gradient circle behind token */}
          <View style={styles.gradientCircleContainer}>
            <Canvas style={styles.gradientCanvas}>
              <Circle cx={TOKEN_GRADIENT_BORDER_SIZE / 2} cy={TOKEN_GRADIENT_BORDER_SIZE / 2} r={TOKEN_GRADIENT_BORDER_SIZE / 2}>
                <LinearGradient
                  start={vec(TOKEN_GRADIENT_BORDER_SIZE / 2, 0)}
                  end={vec(TOKEN_GRADIENT_BORDER_SIZE / 2, TOKEN_GRADIENT_BORDER_SIZE)}
                  colors={['#02ADDE', '#fff671ff', '#f27c61ff', '#9a86a4ff']}
                  positions={[0, 0.2, 0.7, 1]}
                />
              </Circle>
            </Canvas>
          </View>

          <View style={styles.tokenImage}>
            <ShinyCoinIcon imageUrl={sizedIconUrl} size={TOKEN_SIZE} />
          </View>

          {/* chain image */}
          <View style={styles.chainImageContainer}>
            <ChainImage chainId={currentWinningToken.chainId} size={24} position="absolute" style={styles.chainImageShadow} />
          </View>

          <Image source={crownImage} style={styles.crown} />
        </View>
      </ButtonPressAnimation>

      {/* round ends */}
      <View style={styles.roundEndsContainer}>
        <GradientBorderContent borderRadius={12} height={28}>
          <View style={styles.roundEndsContent}>
            <Text color="labelSecondary" size="13pt" weight="heavy">
              {i18n.t(i18n.l.king_of_hill.round_ends_in)} {timeRemaining}
            </Text>
          </View>
        </GradientBorderContent>
      </View>

      {/* symbol, price change */}
      <ButtonPressAnimation onPress={navigateToToken}>
        <View style={styles.symbolPriceContainer}>
          <Text color="label" size="20pt" weight="heavy">
            {currentWinningToken.symbol}
          </Text>
          <Text color={getPriceChangeColor(priceChange)} size="17pt" weight="bold">
            {priceChange}
          </Text>
          <Text color="labelQuaternary" size="icon 11px" weight="bold" style={styles.caretContainer}>
            {CHEVRON_RIGHT_SYMBOL}
          </Text>
        </View>
      </ButtonPressAnimation>

      {/* price */}
      <Text color="label" size="30pt" weight="heavy" align="center" style={styles.priceContainer}>
        {currentPrice}
      </Text>

      {/* vol | mcap */}
      <View style={styles.statsContainer}>
        {creatorAddress && (
          <>
            <CreatorDisplay creatorAddress={creatorAddress} />
            <View>
              <Separator direction="vertical" color="separatorSecondary" />
            </View>
          </>
        )}
        <View style={styles.statItem}>
          <Text color="labelQuaternary" size="13pt" weight="bold">
            {i18n.t(i18n.l.king_of_hill.vol)}
          </Text>
          <Text color="labelTertiary" size="13pt" weight="bold">
            {volume}
          </Text>
        </View>
        <View>
          <Separator direction="vertical" color="separatorSecondary" />
        </View>
        <View style={styles.statItem}>
          <Text color="labelQuaternary" size="13pt" weight="bold">
            {i18n.t(i18n.l.king_of_hill.mcap)}
          </Text>
          <Text color="labelTertiary" size="13pt" weight="bold">
            {marketCap}
          </Text>
        </View>
      </View>

      {/* last winner / how it works */}
      <View style={styles.buttonsContainer}>
        <HeaderButton onPress={lastWinner ? navigateToLastWinner : navigateToExplainSheet} iconUrl={lastWinner ? lastWinnerIconUrl : null}>
          {lastWinner && (
            // maxWidth = how it works 120px + last winner outer content 130px + side pad 20px * 2 + gap between 20px
            <View style={{ maxWidth: deviceWidth - (120 + 130 + 20 * 2 + 20), marginRight: 8 }}>
              <Text color="labelTertiary" size="13pt" weight="bold" ellipsizeMode="tail" numberOfLines={1}>
                {lastWinner.token.symbol}
              </Text>
            </View>
          )}
          <Text color="labelQuaternary" size="13pt" weight="bold">
            {lastWinner ? i18n.t(i18n.l.king_of_hill.last_winner) : i18n.t(i18n.l.king_of_hill.no_previous_winner)}
          </Text>
        </HeaderButton>

        <HeaderButton onPress={navigateToExplainSheet}>
          <Text color="labelTertiary" size="13pt" weight="bold">
            {i18n.t(i18n.l.king_of_hill.how_it_works)}
          </Text>
        </HeaderButton>
      </View>

      <View style={{ marginTop: 15, width: '100%' }}>
        <Separator color="separatorTertiary" direction="horizontal" />
      </View>
    </View>
  );
});

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
    overflow: 'hidden',
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
    transform: [{ translateY: -30 }],
    opacity: 0.8,
  },
  gradientCircleContainer: {
    position: 'absolute',
    width: TOKEN_GRADIENT_BORDER_SIZE,
    height: TOKEN_GRADIENT_BORDER_SIZE,
    zIndex: 1,
    opacity: 0.75,
  },
  gradientCanvas: {
    width: TOKEN_GRADIENT_BORDER_SIZE,
    height: TOKEN_GRADIENT_BORDER_SIZE,
  },
  crown: {
    position: 'absolute',
    top: 11,
    left: TOKEN_SIZE / 2 + 20,
    width: 40,
    height: 35,
    // transform: [{ rotate: '-3deg' }],
    zIndex: 10,
  },
  chainImageContainer: {
    position: 'absolute',
    bottom: TOKEN_SIZE / 2 - 8,
    left: TOKEN_SIZE / 2 - 6,
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
    marginTop: -14,
    height: 32,
  },
  roundEndsContent: {
    paddingHorizontal: 12,
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
  priceContainer: {
    marginTop: 11,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
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
});
