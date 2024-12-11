import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { StyleProp, ViewStyle } from 'react-native';
import { SharedValue } from 'react-native-reanimated';

export type ShadowConfig = {
  shadowColor: string;
  shadowOffset: {
    height: number;
    width: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
};

export type AnimatedChainImageProps = {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  showMainnetBadge?: boolean;
  shadowConfig?: ShadowConfig;
  size?: number;
  style?: StyleProp<ViewStyle>;
};
