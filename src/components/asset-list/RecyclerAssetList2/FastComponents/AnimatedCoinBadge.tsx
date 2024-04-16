import React, { useState } from 'react';
import { Image, ImageSourcePropType, View, ViewStyle } from 'react-native';
import ArbitrumBadge from '@/assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '@/assets/badges/arbitrumBadgeDark.png';
import OptimismBadge from '@/assets/badges/optimismBadge.png';
import OptimismBadgeDark from '@/assets/badges/optimismBadgeDark.png';
import PolygonBadge from '@/assets/badges/polygonBadge.png';
import PolygonBadgeDark from '@/assets/badges/polygonBadgeDark.png';
import BscBadge from '@/assets/badges/bscBadge.png';
import BscBadgeDark from '@/assets/badges/bscBadgeDark.png';
import ZoraBadge from '@/assets/badges/zoraBadge.png';
import ZoraBadgeDark from '@/assets/badges/zoraBadgeDark.png';
import BaseBadge from '@/assets/badges/baseBadge.png';
import BaseBadgeDark from '@/assets/badges/baseBadgeDark.png';
import AvalancheBadge from '@/assets/badges/avalancheBadge.png';
import AvalancheBadgeDark from '@/assets/badges/avalancheBadgeDark.png';
import BlastBadge from '@/assets/badges/blastBadge.png';
import BlastBadgeDark from '@/assets/badges/blastBadgeDark.png';
import { DerivedValue, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { ChainId } from '@/__swaps__/types/chains';

interface AnimatedCoinBadgeProps {
  chainId: DerivedValue<ChainId>;
  theme: any;
}

const AssetIconsByTheme: {
  [index: number]: {
    dark: ImageSourcePropType;
    light: ImageSourcePropType;
  };
} = {
  [ChainId.arbitrum]: {
    dark: ArbitrumBadgeDark,
    light: ArbitrumBadge,
  },
  [ChainId.optimism]: {
    dark: OptimismBadgeDark,
    light: OptimismBadge,
  },
  [ChainId.polygon]: {
    dark: PolygonBadgeDark,
    light: PolygonBadge,
  },
  [ChainId.bsc]: {
    dark: BscBadgeDark,
    light: BscBadge,
  },
  [ChainId.zora]: {
    dark: ZoraBadgeDark,
    light: ZoraBadge,
  },
  [ChainId.base]: {
    dark: BaseBadgeDark,
    light: BaseBadge,
  },
  [ChainId.avalanche]: {
    dark: AvalancheBadgeDark,
    light: AvalancheBadge,
  },
  [ChainId.blast]: {
    dark: BlastBadgeDark,
    light: BlastBadge,
  },
};

export const AnimatedChainBadge = function FastChainBadge({ chainId, theme }: AnimatedCoinBadgeProps) {
  const { isDarkMode } = theme;
  const [imageSource, setImageSource] = useState<ImageSourcePropType | undefined>(undefined);

  const imageStyles = {
    height: 44,
    width: 44,
    top: 4,
  };

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    bottom: 5.5,
    elevation: 10,
    height: 28,
    left: -11.5,
    position: 'absolute',
    width: 28,
    zIndex: 10,
  };

  useAnimatedReaction(
    () => chainId.value, // This function should return the value you want to react to.
    currentChainId => {
      // This function runs whenever the value returned by the first function changes.
      // You can use currentChainId and previousChainId to react to changes.
      // However, for your use case, you might not need previousChainId.
      const src = isDarkMode ? AssetIconsByTheme[currentChainId]?.dark : AssetIconsByTheme[currentChainId]?.light;

      if (src) {
        runOnJS(setImageSource)(src); // Correctly call runOnJS with setImageSource and pass src as an argument.
      } else {
        runOnJS(setImageSource)(undefined);
      }
    },
    [isDarkMode] // Add isDarkMode to the dependency array if your theme can change.
  );

  if (!imageSource) return;

  return (
    <View style={containerStyle}>
      <Image source={imageSource!} style={imageStyles} />
    </View>
  );
};
