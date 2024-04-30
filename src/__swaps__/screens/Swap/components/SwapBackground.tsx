import React, { useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

import { useColorMode } from '@/design-system';
import { extractColorValueForColors, getTintedBackgroundColor } from '@/__swaps__/utils/swaps';
import { IS_ANDROID } from '@/env';
import { navbarHeight } from '@/components/navbar/Navbar';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { useSwapAssets } from '@/state/swaps/assets';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { StyleSheet } from 'react-native';

export const SwapBackground = () => {
  const { isDarkMode } = useColorMode();

  const assetToSellColors = useSwapAssets(state => state.assetToSell?.colors);
  const assetToBuyColors = useSwapAssets(state => state.assetToBuy?.colors);

  const assetToSellColor = useMemo(() => {
    return extractColorValueForColors({
      colors: assetToSellColors as TokenColors,
      isDarkMode,
    });
  }, [assetToSellColors, isDarkMode]);

  const assetToBuyColor = useMemo(() => {
    return extractColorValueForColors({
      colors: assetToBuyColors as TokenColors,
      isDarkMode,
    });
  }, [assetToBuyColors, isDarkMode]);

  const bottomColorDarkened = getTintedBackgroundColor(assetToBuyColor, isDarkMode);
  const topColorDarkened = getTintedBackgroundColor(assetToSellColor, isDarkMode);

  return (
    <LinearGradient
      colors={[topColorDarkened, bottomColorDarkened]}
      style={[
        sx.container,
        {
          backgroundColor: assetToSellColor,
        },
      ]}
      end={{ x: 0.5, y: 1 }}
      start={{ x: 0.5, y: 0 }}
    />
  );
};

const sx = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: -10,
    borderRadius: IS_ANDROID ? 20 : ScreenCornerRadius,
    height: deviceUtils.dimensions.height + (IS_ANDROID ? 24 : 0),
    paddingTop: safeAreaInsetValues.top + (navbarHeight - 12),
    width: deviceUtils.dimensions.width,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
