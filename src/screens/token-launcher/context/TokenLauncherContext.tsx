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

type TokenLauncherContextType = {
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

export function TokenLauncherContextProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const { nativeCurrency } = useAccountSettings();

  const setEthPriceUsd = useTokenLauncherStore(state => state.setEthPriceUsd);
  const setEthPriceNative = useTokenLauncherStore(state => state.setEthPriceNative);

  const imageUrl = useTokenLauncherStore(state => state.imageUrl);
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

    // console.log('primaryColor', primaryColor, imageDerivedColor);

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

  // TODO: does it matter if we only use mainnet here? Do we want to poll the price and if so, how often?
  // does this return in usd or users native currency?
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

  // TODO: is there a better way to do this?
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

  return <TokenLauncherContext.Provider value={{ accentColors }}>{children}</TokenLauncherContext.Provider>;
}
