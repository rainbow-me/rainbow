import React, { useCallback, useEffect } from 'react';
import * as i18n from '@/languages';
import { Box, Inline, Stack, Text, useColorMode } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR } from '@/__swaps__/screens/Swap/constants';
import FastImage from 'react-native-fast-image';
import { getSizedImageUrl } from '@/handlers/imgix';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { KingOfTheHill } from '@/graphql/__generated__/metadata';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'react-native-blur-view';
import { IS_IOS } from '@/env';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import FireIcon from './FireIcon';
import { RainbowGlow } from './RainbowGlow';

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
    bottom: TOKEN_SIZE / 2 - 12,
    right: TOKEN_SIZE / 2 - 12,
    zIndex: 3,
  },
});

export function Header({ kingOfTheHill, onColorExtracted }: HeaderProps) {
  const { isDarkMode } = useColorMode();
  const current = kingOfTheHill?.current;
  const lastWinner = kingOfTheHill?.lastWinner;
  
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

  if (!current) return null;

  const { token } = current;
  const sizedIconUrl = getSizedImageUrl(token.iconUrl, 160);
  const lastWinnerIconUrl = lastWinner ? getSizedImageUrl(lastWinner.token.iconUrl, 16) : null;
  
  // Extract dominant color from token image
  const dominantColor = usePersistentDominantColorFromImage(sizedIconUrl);
  
  // Pass color to parent
  useEffect(() => {
    if (onColorExtracted && dominantColor) {
      onColorExtracted(dominantColor);
    }
  }, [dominantColor, onColorExtracted]);

  // TODO: Calculate actual time remaining
  const timeRemaining = "24h 30m";
  
  // TODO: Get actual price data
  const priceChange = "+12.5%";
  const currentPrice = "$1,234.56";
  const volume = "$12.3M";
  const marketCap = "$456.7M";

  return (
    <Stack space="16px" alignHorizontal="center">
      {/* King image with rainbow glow and fire icon */}
      <View style={styles.tokenImageContainer}>
        <View style={styles.glowContainer}>
          <RainbowGlow size={TOKEN_SIZE} />
        </View>
        <FastImage source={{ uri: sizedIconUrl }} style={styles.tokenImage} />
        <View style={styles.fireIcon}>
          <FireIcon size={24} />
        </View>
      </View>

      {/* Round timer */}
      <Box borderRadius={16} style={{ overflow: 'hidden' }}>
        {IS_IOS && (
          <Box position="absolute" width="full" height="full">
            <BlurView blurStyle={isDarkMode ? 'dark' : 'light'} style={{ width: '100%', height: '100%' }} />
          </Box>
        )}
        <Box 
          paddingHorizontal="16px" 
          paddingVertical="8px"
          backgroundColor={IS_IOS ? undefined : (isDarkMode ? 'fillSecondary' : 'fillTertiary')}
        >
          <Text color="labelSecondary" size="13pt" weight="semibold">
            Round ends in {timeRemaining}
          </Text>
        </Box>
      </Box>

      {/* Symbol and price change */}
      <Inline alignVertical="center" space="8px">
        <Text color="label" size="17pt" weight="bold">
          {token.symbol}
        </Text>
        <Text color={priceChange.startsWith('+') ? 'green' : 'red'} size="17pt" weight="bold">
          {priceChange}
        </Text>
      </Inline>

      {/* Current price */}
      <Text color="label" size="26pt" weight="heavy" align="center">
        {currentPrice}
      </Text>

      {/* VOL | MCAP row */}
      <Box flexDirection="row" alignItems="center">
        <Text color="labelTertiary" size="13pt" weight="semibold">
          VOL {volume}
        </Text>
        <Box width={{ custom: 1 }} height={{ custom: 16 }} backgroundColor={isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR} marginHorizontal={{ custom: 12 }} />
        <Text color="labelTertiary" size="13pt" weight="semibold">
          MCAP {marketCap}
        </Text>
      </Box>

      {/* Last winner and How it works buttons */}
      <Box width="full" flexDirection="row" justifyContent="space-between" paddingHorizontal="20px">
        <ButtonPressAnimation onPress={lastWinner ? navigateToLastWinner : navigateToExplainSheet}>
          <Box 
            flexDirection="row" 
            alignItems="center" 
            backgroundColor={isDarkMode ? 'fillSecondary' : 'fillTertiary'}
            borderRadius={20}
            paddingHorizontal="12px"
            paddingVertical="8px"
            height={{ custom: 32 }}
          >
            {lastWinner ? (
              <>
                {lastWinnerIconUrl && (
                  <FastImage source={{ uri: lastWinnerIconUrl }} style={{ width: 16, height: 16, borderRadius: 8, marginRight: 6 }} />
                )}
                <Text color="labelSecondary" size="13pt" weight="semibold">
                  {lastWinner.token.symbol} Last Winner
                </Text>
              </>
            ) : (
              <Text color="labelSecondary" size="13pt" weight="semibold">
                No Previous Winner
              </Text>
            )}
          </Box>
        </ButtonPressAnimation>
        
        <ButtonPressAnimation onPress={navigateToExplainSheet}>
          <Box 
            backgroundColor={isDarkMode ? 'fillSecondary' : 'fillTertiary'}
            borderRadius={20}
            paddingHorizontal="12px"
            paddingVertical="8px"
            height={{ custom: 32 }}
            alignItems="center"
            justifyContent="center"
          >
            <Text color="labelSecondary" size="13pt" weight="semibold">
              How it works
            </Text>
          </Box>
        </ButtonPressAnimation>
      </Box>

      {/* Separator */}
      <Box width="full" height={{ custom: 1 }} backgroundColor={isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR} />
    </Stack>
  );
}