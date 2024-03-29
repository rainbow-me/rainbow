import { useState, useEffect } from 'react';
import { useSwapAssetStore } from '../state/assets';
import { useColorMode } from '@/design-system';
import { ETH_COLOR, ETH_COLOR_DARK } from '../constants';

interface AssetColors {
  topColor: string;
  bottomColor: string;
  assetToSellShadowColor: string;
  assetToBuyShadowColor: string;
}

type Colors = {
  primary?: string;
  fallback?: string;
  shadow?: string;
};

const extractColorValueForColors = ({ colors, isDarkMode }: { colors?: Colors; isDarkMode: boolean }): string => {
  if (colors?.primary) {
    return colors.primary;
  }

  if (colors?.fallback) {
    return colors.fallback;
  }

  return isDarkMode ? ETH_COLOR_DARK : ETH_COLOR;
};

// NOTE: This hook is not used anymore and you should use the SwapInputController inputTokenColor and outputTokenColor instead
export const useAssetColors = (): AssetColors => {
  const { isDarkMode } = useColorMode();
  const { assetToBuy, assetToSell } = useSwapAssetStore();
  const [topColor, setTopColor] = useState<string>(isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);
  const [bottomColor, setBottomColor] = useState<string>(isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);
  const [assetToSellShadowColor, setAssetToSellShadowColor] = useState<string>(isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);
  const [assetToBuyShadowColor, setAssetToBuyShadowColor] = useState<string>(isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);

  useEffect(() => {
    const newTopColor = extractColorValueForColors({
      colors: assetToSell?.colors,
      isDarkMode,
    });

    const newBottomColor = extractColorValueForColors({
      colors: assetToBuy?.colors,
      isDarkMode,
    });

    const assetToSellShadow = assetToSell?.colors?.shadow ?? (isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);
    const assetToBuyShadow = assetToBuy?.colors?.shadow ?? (isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);

    setTopColor(newTopColor);
    setBottomColor(newBottomColor);
    setAssetToSellShadowColor(assetToSellShadow);
    setAssetToBuyShadowColor(assetToBuyShadow);
  }, [assetToBuy, assetToSell, isDarkMode]);

  return { topColor, bottomColor, assetToSellShadowColor, assetToBuyShadowColor };
};
