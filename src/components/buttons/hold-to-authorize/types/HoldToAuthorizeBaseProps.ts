import { type StyleProp, type ViewStyle } from 'react-native';
import type { DeviceDimensions } from '@/hooks/useDimensions';
import { type Colors } from '@/styles';

export interface HoldToAuthorizeBaseProps {
  backgroundColor: string;
  colors?: Colors;
  deviceDimensions?: DeviceDimensions;
  disabled: boolean;
  disabledBackgroundColor?: string;
  disableShimmerAnimation?: boolean;
  enableLongPress?: boolean;
  hideInnerBorder: boolean;
  isAuthorizing?: boolean;
  // we use this to handle when we would do something other than sign a tx, like show an explain sheet
  ignoreHardwareWallet?: boolean;
  isHardwareWallet?: boolean;
  label: string;
  onLongPress: () => void;
  parentHorizontalPadding: number;
  shadows?: [number, number, number, string, number][];
  showBiometryIcon: boolean;
  smallButton?: boolean;
  style?: StyleProp<ViewStyle>;
  testID: string;
  theme?: 'light' | 'dark';
  tinyButton?: boolean;
  loading?: boolean;
}
