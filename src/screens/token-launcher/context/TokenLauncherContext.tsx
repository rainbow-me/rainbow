import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { getAlphaColor, useTokenLauncherStore } from '../state/tokenLauncherStore';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { useColorMode } from '@/design-system';
import { useTheme } from '@/theme';
import { DEFAULT_TOKEN_IMAGE_PRIMARY_COLOR } from '../constants';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { ChainId } from '@/state/backendNetworks/types';
import { ETH_ADDRESS } from '@/references';
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
import { SharedValue } from 'react-native-reanimated';

type TokenLauncherContextType = {
  ethRequiredForTransactionGas: string;
  tokenSkiaImage: SkImage | SharedValue<SkImage | null>;
  accentColors: {
    opacity100: string;
    opacity30: string;
    opacity20: string;
    opacity12: string;
    opacity10: string;
    opacity6: string;
    opacity4: string;
    opacity3: string;
    opacity2: string;
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
  const setHasSufficientEthForTransactionGas = useTokenLauncherStore(state => state.setHasSufficientEthForGas);

  const gasSettings = useGasSettings(chainId, gasSpeed);

  const setEthPriceUsd = useTokenLauncherStore(state => state.setEthPriceUsd);
  const setEthPriceNative = useTokenLauncherStore(state => state.setEthPriceNative);

  const imageUrl = useTokenLauncherStore(state => state.imageUrl);
  const imageUri = useTokenLauncherStore(state => state.imageUrl);
  // This hook works for both normal images and gifs
  // TODO: this is causing problems for the success image step
  // const tokenSkiaImage = useAnimatedImageValue(imageUri);
  const tokenSkiaImage = useImage(imageUri);

  const imageDerivedColor = usePersistentDominantColorFromImage(imageUrl);

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

    return {
      opacity100: primaryColor,
      opacity30: getAlphaColor(primaryColor, 0.3),
      opacity20: getAlphaColor(primaryColor, 0.2),
      opacity12: getAlphaColor(primaryColor, 0.12),
      opacity10: getAlphaColor(primaryColor, 0.1),
      opacity6: getAlphaColor(primaryColor, 0.06),
      opacity4: getAlphaColor(primaryColor, 0.04),
      opacity3: getAlphaColor(primaryColor, 0.03),
      opacity2: getAlphaColor(primaryColor, 0.02),
    };
  }, [colors, imageDerivedColor, isDarkMode]);

  const ethRequiredForTransactionGas = useMemo(() => {
    if (!gasSettings) return '0';

    const gasLimit = estimateLaunchTransactionGasLimit({
      chainId,
      gasSettings,
      isPrebuying: false,
    });
    const gasFeeWei = calculateGasFeeWorklet(gasSettings, gasLimit);
    const nativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];

    return formatUnits(safeBigInt(gasFeeWei), nativeAsset.decimals);
  }, [chainId, gasSettings]);

  useEffect(() => {
    const userNativeAsset = userAssetsStore.getState().getNativeAssetForChain(chainId);
    const userBalance = userNativeAsset?.balance?.amount || '0';

    const hasSufficientEthForTransactionGas = lessThanOrEqualToWorklet(ethRequiredForTransactionGas, userBalance);
    setHasSufficientEthForTransactionGas(hasSufficientEthForTransactionGas);
  }, [chainId, ethRequiredForTransactionGas, setHasSufficientEthForTransactionGas]);

  // TODO: We need eth price in both USD and the user's native currency. We need USD because the target price is USD.
  // We need the native currency for display. Is there a better way to do this then calling two separate fetches?

  // TODO: does it matter if we only use mainnet here? Do we want to poll the price and if so, how often?
  const { data: ethAssetUsd } = useExternalToken(
    {
      address: ETH_ADDRESS,
      chainId: ChainId.mainnet,
      // We explicitly need it in USD because the target market cap is in USD
      currency: 'USD',
    },
    {
      // We're okay with initially showing stale data
      keepPreviousData: true,
      // We always want to know the latest price
      staleTime: time.minutes(1),
    }
  );
  const { data: ethAssetNative } = useExternalToken(
    {
      address: ETH_ADDRESS,
      chainId: ChainId.mainnet,
      currency: nativeCurrency,
    },
    {
      // We're okay with initially showing stale data
      keepPreviousData: true,
      // We always want to know the latest price
      staleTime: time.minutes(1),
    }
  );

  const ethPriceUsd = ethAssetUsd?.price.value;
  const ethPriceNative = ethAssetNative?.price.value;

  useEffect(() => {
    if (ethPriceUsd) {
      setEthPriceUsd(ethPriceUsd);
    }
    if (ethPriceNative) {
      setEthPriceNative(ethPriceNative);
    }
  }, [ethPriceNative, ethPriceUsd, setEthPriceNative, setEthPriceUsd]);

  return (
    <TokenLauncherContext.Provider value={{ accentColors, ethRequiredForTransactionGas, tokenSkiaImage }}>
      {children}
    </TokenLauncherContext.Provider>
  );
}
