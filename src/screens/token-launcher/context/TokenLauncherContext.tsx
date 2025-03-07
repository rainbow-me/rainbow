import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { getAlphaColor, useTokenLauncherStore } from '../state/tokenLauncherStore';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { useColorMode } from '@/design-system';
import { useTheme } from '@/theme';
import { DEFAULT_TOKEN_IMAGE_PRIMARY_COLOR } from '../constants';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { BackendNetwork, ChainId } from '@/state/backendNetworks/types';
import { time } from '@/utils';
import { useAccountSettings } from '@/hooks';
import { useGasSettings } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { formatUnits } from 'viem';
import { safeBigInt } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { lessThanOrEqualToWorklet } from '@/safe-math/SafeMath';
import { SkImage, useAnimatedImageValue, useImage } from '@shopify/react-native-skia';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';
import { SharedValue } from 'react-native-reanimated';

type TokenLauncherContextType = {
  chainNativeAssetRequiredForTransactionGas: string;
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

// TODO: these values will likely come from sdk
export function estimateLaunchTransactionGasLimit({
  chainId,
  gasSettings,
  isPrebuying,
}: {
  chainId: ChainId;
  gasSettings: GasSettings | undefined;
  isPrebuying: boolean;
}) {
  return '8000000';
}

export function TokenLauncherContextProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const { nativeCurrency } = useAccountSettings();
  const chainId = useTokenLauncherStore(state => state.chainId);
  const gasSpeed = useTokenLauncherStore(state => state.gasSpeed);
  const setHasSufficientChainNativeAssetForTransactionGas = useTokenLauncherStore(
    state => state.setHasSufficientChainNativeAssetForTransactionGas
  );
  const chainNativeAsset = useBackendNetworksStore(state => state.getChainsNativeAsset()[chainId]);
  const gasSettings = useGasSettings(chainId, gasSpeed);

  const setChainNativeAssetUsdPrice = useTokenLauncherStore(state => state.setChainNativeAssetUsdPrice);
  const setChainNativeAssetNativePrice = useTokenLauncherStore(state => state.setChainNativeAssetNativePrice);

  // const imageUrl = useTokenLauncherStore(state => state.imageUrl);
  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const isImageGif = useMemo(() => imageUri?.endsWith('.gif'), [imageUri]);

  const skiaImage = useImage(imageUri);
  // The result of this hook works for displaying both normal images and gifs
  const animatedSkiaImage = useAnimatedImageValue(imageUri);

  const tokenImage: SkImage | null | SharedValue<SkImage | null> = useMemo(() => {
    if (isImageGif) {
      return animatedSkiaImage;
    }
    return skiaImage;
  }, [animatedSkiaImage, isImageGif, skiaImage]);

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
    } catch (e) {
      // do nothing
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
      opacity12: getAlphaColor(primaryColor, 0.12),
      opacity10: getAlphaColor(primaryColor, 0.1),
      opacity6: getAlphaColor(primaryColor, 0.06),
      opacity4: getAlphaColor(primaryColor, 0.04),
      opacity3: getAlphaColor(primaryColor, 0.03),
      opacity2: getAlphaColor(primaryColor, 0.02),
      highContrastTextColor,
    };
  }, [colors, imageDerivedColor, isDarkMode]);

  const chainNativeAssetRequiredForTransactionGas = useMemo(() => {
    if (!gasSettings) return '0';

    const gasLimit = estimateLaunchTransactionGasLimit({
      chainId,
      gasSettings,
      isPrebuying: false,
    });
    const gasFeeWei = calculateGasFeeWorklet(gasSettings, gasLimit);

    return formatUnits(safeBigInt(gasFeeWei), chainNativeAsset.decimals);
  }, [chainId, chainNativeAsset, gasSettings]);

  useEffect(() => {
    const userNativeAsset = userAssetsStore.getState().getNativeAssetForChain(chainId);
    const userBalance = userNativeAsset?.balance?.amount || '0';

    const hasSufficientChainNativeAssetForTransactionGas = lessThanOrEqualToWorklet(chainNativeAssetRequiredForTransactionGas, userBalance);
    setHasSufficientChainNativeAssetForTransactionGas(hasSufficientChainNativeAssetForTransactionGas);
  }, [chainId, chainNativeAssetRequiredForTransactionGas, setHasSufficientChainNativeAssetForTransactionGas]);

  // We explicitly need it in USD as well as the user's native currency because the target market cap is in USD
  const { data: chainNativeAssetUsd } = useExternalToken(
    {
      address: chainNativeAsset.address,
      chainId: chainId,
      currency: 'USD',
    },
    {
      keepPreviousData: true,
      staleTime: time.minutes(1),
    }
  );
  const { data: chainNativeAssetNative } = useExternalToken(
    {
      address: chainNativeAsset.address,
      chainId: chainId,
      currency: nativeCurrency,
    },
    {
      keepPreviousData: true,
      staleTime: time.minutes(1),
    }
  );

  const chainNativeAssetUsdPrice = chainNativeAssetUsd?.price.value;
  const chainNativeAssetNativePrice = chainNativeAssetNative?.price.value;

  useEffect(() => {
    if (chainNativeAssetUsdPrice) {
      setChainNativeAssetUsdPrice(chainNativeAssetUsdPrice);
    }
    if (chainNativeAssetNativePrice) {
      setChainNativeAssetNativePrice(chainNativeAssetNativePrice);
    }
  }, [chainNativeAssetNativePrice, chainNativeAssetUsdPrice, setChainNativeAssetNativePrice, setChainNativeAssetUsdPrice]);

  return (
    <TokenLauncherContext.Provider
      value={{ accentColors, chainNativeAssetRequiredForTransactionGas, tokenImage, tokenBackgroundImage, chainNativeAsset }}
    >
      {children}
    </TokenLauncherContext.Provider>
  );
}
