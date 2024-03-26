import React, { ReactNode, useMemo } from 'react';
import { useColorMode, Box } from '@/design-system';
import LinearGradient from 'react-native-linear-gradient';
import { useDimensions } from '@/hooks';
import { ETH_COLOR, ETH_COLOR_DARK } from '../constants';
import { getTintedBackgroundColor } from '../utils/swaps';
import { IS_ANDROID } from '@/env';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';
import { navbarHeight } from '@/components/navbar/Navbar';
import { safeAreaInsetValues } from '@/utils';
import { useAssetColors } from '../hooks/useAssetColors';

export const SwapBackground = ({ children }: { children: ReactNode }) => {
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { isDarkMode } = useColorMode();
  const { topColor, bottomColor } = useAssetColors();

  const fallbackColor = isDarkMode ? ETH_COLOR_DARK : ETH_COLOR;

  const bottomColorDarkened = useMemo(
    () => getTintedBackgroundColor(bottomColor || fallbackColor, isDarkMode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bottomColor, isDarkMode]
  );
  const topColorDarkened = useMemo(
    () => getTintedBackgroundColor(topColor || fallbackColor, isDarkMode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDarkMode, topColor]
  );

  return (
    <Box
      alignItems="center"
      as={LinearGradient}
      borderRadius={IS_ANDROID ? 20 : ScreenCornerRadius}
      colors={[topColorDarkened, bottomColorDarkened]}
      end={{ x: 0.5, y: 1 }}
      height={{ custom: deviceHeight + (IS_ANDROID ? 24 : 0) }}
      justifyContent="center"
      paddingTop={{ custom: safeAreaInsetValues.top + (navbarHeight - 12) }}
      start={{ x: 0.5, y: 0 }}
      style={{ backgroundColor: topColor }}
      width={{ custom: deviceWidth }}
    >
      {children}
    </Box>
  );
};
