import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { getAlphaColor, useTokenLauncherStore } from '../state/tokenLauncherStore';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { useColorMode } from '@/design-system';
import { useTheme } from '@/theme';
import { DEFAULT_TOKEN_IMAGE_PRIMARY_COLOR } from '../constants';
import { BackendNetwork } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { SkImage, useAnimatedImageValue, useImage } from '@shopify/react-native-skia';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';
import { SharedValue } from 'react-native-reanimated';
import { logger, RainbowError } from '@/logger';
import { useCleanup, useCoinListEditOptions } from '@/hooks';
import { getUniqueId } from '@/utils/ethereumUtils';

type TokenLauncherContextType = {
  tokenBackgroundImage: SkImage | null;
  tokenImage: SkImage | null | SharedValue<SkImage | null>;
  chainNativeAsset: BackendNetwork['nativeAsset'];
  accentColors: {
    opacity100: string;
    opacity90: string;
    opacity80: string;
    opacity70: string;
    opacity60: string;
    opacity50: string;
    opacity40: string;
    opacity30: string;
    opacity20: string;
    opacity16: string;
    opacity12: string;
    opacity10: string;
    opacity6: string;
    opacity4: string;
    opacity3: string;
    opacity2: string;
    highContrastTextColor: string;
  };
};

const TokenLauncherContext = createContext<TokenLauncherContextType | undefined>(undefined);

export function useTokenLauncherContext() {
  const context = useContext(TokenLauncherContext);
  if (context === undefined) {
    throw new Error('useTokenLauncherContext must be used within a TokenLauncherContextProvider');
  }
  return context;
}

export function TokenLauncherContextProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const chainId = useTokenLauncherStore(state => state.chainId);
  const chainNativeAsset = useBackendNetworksStore(state => state.getChainsNativeAsset()[chainId]);
  const launchedTokenAddress = useTokenLauncherStore(state => state.launchedTokenAddress);

  // Handle automatically pinning token when it is created
  const { addPinnedCoin } = useCoinListEditOptions();
  useEffect(() => {
    // As soon as token is created, pin it
    if (launchedTokenAddress) {
      const launchedTokenUniqueId = getUniqueId(launchedTokenAddress, chainId);
      addPinnedCoin(launchedTokenUniqueId);
    }
  }, [launchedTokenAddress, chainId, addPinnedCoin]);

  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const isImageGif = useMemo(() => imageUri?.endsWith('.gif'), [imageUri]);

  const skiaImage = useImage(imageUri || undefined);
  // The result of this hook works for displaying both normal images and gifs
  const animatedSkiaImage = useAnimatedImageValue(imageUri || undefined);

  const tokenImage: SkImage | null | SharedValue<SkImage | null> = useMemo(() => {
    if (isImageGif) {
      return animatedSkiaImage;
    }
    return skiaImage;
  }, [animatedSkiaImage, isImageGif, skiaImage]);

  useCleanup(() => {
    skiaImage?.dispose();
    animatedSkiaImage?.value?.dispose();
  });

  const tokenBackgroundImage: SkImage | null = skiaImage;
  const imageDerivedColor = usePersistentDominantColorFromImage(imageUri);

  const accentColors = useMemo(() => {
    let primaryColor = imageDerivedColor ?? DEFAULT_TOKEN_IMAGE_PRIMARY_COLOR;
    try {
      // brighten up dark colors in dark mode
      if (isDarkMode && colors.isColorDark(primaryColor)) {
        primaryColor = colors.brighten(primaryColor);
      } else if (!isDarkMode) {
        primaryColor = getHighContrastColor(primaryColor, isDarkMode);
      }
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      logger.error(new RainbowError('[TokenLauncher]: Error getting dominant color from image'), {
        message: error.message,
      });
    }

    const highContrastTextColor = getHighContrastTextColorWorklet(primaryColor, undefined, false);

    return {
      opacity100: primaryColor,
      opacity90: getAlphaColor(primaryColor, 0.9),
      opacity80: getAlphaColor(primaryColor, 0.8),
      opacity70: getAlphaColor(primaryColor, 0.7),
      opacity60: getAlphaColor(primaryColor, 0.6),
      opacity50: getAlphaColor(primaryColor, 0.5),
      opacity40: getAlphaColor(primaryColor, 0.4),
      opacity30: getAlphaColor(primaryColor, 0.3),
      opacity20: getAlphaColor(primaryColor, 0.2),
      opacity16: getAlphaColor(primaryColor, 0.16),
      opacity12: getAlphaColor(primaryColor, 0.12),
      opacity10: getAlphaColor(primaryColor, 0.1),
      opacity6: getAlphaColor(primaryColor, 0.06),
      opacity4: getAlphaColor(primaryColor, 0.04),
      opacity3: getAlphaColor(primaryColor, 0.03),
      opacity2: getAlphaColor(primaryColor, 0.02),
      highContrastTextColor,
    };
  }, [colors, imageDerivedColor, isDarkMode]);

  return (
    <TokenLauncherContext.Provider value={{ accentColors, tokenImage, tokenBackgroundImage, chainNativeAsset }}>
      {children}
    </TokenLauncherContext.Provider>
  );
}
