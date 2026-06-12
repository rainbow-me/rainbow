import React from 'react';
import { Platform } from 'react-native';

import { LedgerIcon } from '@/components/icons/svg/LedgerIcon';
import { Text } from '@/components/text';
import styled from '@/framework/ui/styled-thing';
import { useIsHardwareWallet } from '@/state/wallets/walletsStore';
import { fonts } from '@/styles';
import { useTheme } from '@/theme/ThemeContext';

import useBiometryType from '../hooks/useBiometryType';
import BiometryTypes from '../types/biometryTypes';

const { Face, FaceID, Fingerprint, none, passcode, TouchID } = BiometryTypes;

const Label = styled(Text).attrs(({ color, size = fonts.size.larger, theme: { colors }, weight = fonts.weight.semibold }) => ({
  align: 'center',
  color: color || colors.appleBlue,
  letterSpacing: 'rounded',
  size,
  weight,
}))({});

export function useBiometryIconString({ showIcon, isHardwareWallet }) {
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
  const isHardwareWallet = useIsHardwareWallet();
  const biometryIcon = useBiometryIconString({ showIcon: Platform.OS !== 'android' && showIcon, isHardwareWallet });
  const { colors } = useTheme();
  return (
    <>
      {isHardwareWallet && showIcon && <LedgerIcon color={props?.color || colors.appleBlue} marginRight={8} />}
      <Label testID={testID || label} {...props} {...(Platform.OS === 'android' && { lineHeight: 23 })}>
        {`${biometryIcon}${label}`}
      </Label>
    </>
  );
}
