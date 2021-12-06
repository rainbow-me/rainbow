import React from 'react';
import styled from 'styled-components';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers' or its co... Remove this comment to see the full error message
import { BiometryTypes } from '@rainbow-me/helpers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useBiometryType } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts } from '@rainbow-me/styles';

const { Face, FaceID, Fingerprint, none, passcode, TouchID } = BiometryTypes;

const Label = styled(Text).attrs(
  ({
    color,
    size = fonts.size.larger,
    theme: { colors },
    weight = fonts.weight.semibold,
  }) => ({
    align: 'center',
    color: color || colors.appleBlue,
    letterSpacing: 'rounded',
    size,
    weight,
  })
)``;

function useBiometryIconString(showIcon: any) {
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
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  const biometryIcon = useBiometryIconString(!android && showIcon);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Label
      testID={testID || label}
      {...props}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      {...(android && { lineHeight: 21 })}
    >
      {`${biometryIcon}${label}`}
    </Label>
  );
}
