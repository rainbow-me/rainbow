import { StyleProp, ViewStyle } from 'react-native';
import { DeviceDimensions } from '@rainbow-me/hooks';
import { Colors } from '@rainbow-me/styles';

export interface HoldToAuthorizeBaseProps {
  backgroundColor: string;
  colors: Colors;
  deviceDimensions: DeviceDimensions;
  disabled: boolean;
  disabledBackgroundColor: string;
  enableLongPress?: boolean;
  hideInnerBorder: boolean;
  isAuthorizing: boolean;
  label: string;
  onLongPress: () => void;
  parentHorizontalPadding: number;
  shadows: [number, number, number, string, number][];
  showBiometryIcon: boolean;
  smallButton: boolean;
  style: StyleProp<ViewStyle>;
  testID: string;
  theme: 'light' | 'dark';
  tinyButton?: boolean;
}
