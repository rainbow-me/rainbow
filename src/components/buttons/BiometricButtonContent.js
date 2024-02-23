import React from 'react';
import { Text } from '../text';
import { BiometryTypes } from '@/helpers';
import { useBiometryType, useWallets } from '@/hooks';
import styled from '@/styled-thing';
import { fonts } from '@/styles';
import { LedgerIcon } from '../icons/svg/LedgerIcon';
import { IS_ANDROID } from '@/env';

const { Face, FaceID, Fingerprint, none, passcode, TouchID } = BiometryTypes;

const Label = styled(Text).attrs(({ color, size = fonts.size.larger, theme: { colors }, weight = fonts.weight.semibold }) => ({
  align: 'center',
  color: color || colors.appleBlue,
  letterSpacing: 'rounded',
  size,
  weight,
}))({});

function useBiometryIconString({ showIcon, isHardwareWallet }) {
  const biometryType = useBiometryType();

  const isFace = biometryType === Face || biometryType === FaceID;
  const isPasscode = biometryType === passcode;
  const isTouch = biometryType === Fingerprint || biometryType === TouchID;

  const getBiometryIconString = () => {
    if (isHardwareWallet) {
      return '';
    } else if (isFace) {
      return '􀎽';
    } else if (isTouch) {
      return '􀟒';
    } else if (isPasscode) {
      return '􀒲';
    } else {
      return '';
    }
  };

  return !biometryType || biometryType === none || !showIcon ? '' : `${getBiometryIconString()} `;
}

export default function BiometricButtonContent({ label, showIcon = true, testID, ...props }) {
  const biometryIcon = useBiometryIconString(!IS_ANDROID && showIcon);
  const { isHardwareWallet } = useWallets();
  const { colors } = useTheme();
  return (
    <>
      {isHardwareWallet && showIcon && <LedgerIcon color={props?.color || colors.appleBlue} marginRight={8} />}
      <Label testID={testID || label} {...props} {...(IS_ANDROID && { lineHeight: 23 })}>
        {`${biometryIcon}${label}`}
      </Label>
    </>
  );
}
