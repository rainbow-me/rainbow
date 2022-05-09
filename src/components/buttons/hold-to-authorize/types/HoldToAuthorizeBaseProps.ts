import { DeviceDimensions } from '@rainbow-me/hooks';

export interface HoldToAuthorizeBaseProps {
  backgroundColor: string;
  // TODO: Fix any if possible
  colors: any;
  deviceDimensions: DeviceDimensions;
  disabled: boolean;
  disabledBackgroundColor: string;
  enableLongPress?: boolean;
  hideInnerBorder: boolean;
  isAuthorizing: boolean;
  label: string;
  onLongPress: () => void;
  parentHorizontalPadding: number;
  shadows: any[][];
  showBiometryIcon: boolean;
  smallButton: boolean;
  style: object;
  testID: string;
  theme: 'light' | 'dark';
  tinyButton?: boolean;
}
