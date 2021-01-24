import React from 'react';
import styled from 'styled-components/primitives';
import { Text } from '../text';
import { BiometryTypes } from '@rainbow-me/helpers';
import { useBiometryType } from '@rainbow-me/hooks';
import { colors, fonts } from '@rainbow-me/styles';

const { Face, FaceID, Fingerprint, none, passcode, TouchID } = BiometryTypes;

const Label = styled(Text).attrs(
  ({
    color = colors.appleBlue,
    size = fonts.size.larger,
    weight = fonts.weight.semibold,
  }) => ({
    align: 'center',
    color,
    letterSpacing: 'rounded',
    size,
    weight,
  })
)``;

function useBiometryIconString(showIcon) {
  const biometryType = useBiometryType();

  const isFace = biometryType === Face || biometryType === FaceID;
  const isPasscode = biometryType === passcode;
  const isTouch = biometryType === Fingerprint || biometryType === TouchID;

  const biometryIconString = isFace
    ? '􀎽'
    : isTouch
    ? '􀟒'
    : isPasscode
    ? '􀒲'
    : '';

  return !biometryType || biometryType === none || !showIcon
    ? ''
    : `${biometryIconString} `;
}

export default function BiometricButtonContent({
  label,
  showIcon = true,
  testID,
  ...props
}) {
  const biometryIcon = useBiometryIconString(!android && showIcon);
  return (
    <Label testID={testID} {...props}>
      {`${biometryIcon}${label}`}
    </Label>
  );
}
