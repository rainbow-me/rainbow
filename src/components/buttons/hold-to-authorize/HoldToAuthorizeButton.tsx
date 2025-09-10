import * as i18n from '@/languages';
import React from 'react';
import HoldToAuthorizeButtonContent from './HoldToAuthorizeButtonContent';
import { HoldToAuthorizeBaseProps } from './types/HoldToAuthorizeBaseProps';
import { BiometryTypes } from '@/helpers';
import { useBiometryType, useDimensions } from '@/hooks';
import { useTheme } from '@/theme';

interface WrapperProps extends HoldToAuthorizeBaseProps {
  label: string;
  disableLongPress?: boolean;
}

const HoldToAuthorizeButtonWithBiometrics = ({ disableLongPress, label, ...props }: WrapperProps) => {
  const biometryType = useBiometryType();
  const { colors } = useTheme();
  const deviceDimensions = useDimensions();

  const isLongPressAvailableForBiometryType =
    biometryType === BiometryTypes.FaceID || biometryType === BiometryTypes.Face || biometryType === BiometryTypes.none;

  return (
    <HoldToAuthorizeButtonContent
      {...props}
      colors={colors}
      deviceDimensions={deviceDimensions}
      enableLongPress={!disableLongPress && isLongPressAvailableForBiometryType}
      label={
        isLongPressAvailableForBiometryType
          ? label
          : label.replace(i18n.t(i18n.l.button.hold_to_authorize.hold_keyword), i18n.t(i18n.l.button.hold_to_authorize.tap_keyword))
      }
    />
  );
};

export default React.memo(HoldToAuthorizeButtonWithBiometrics);
