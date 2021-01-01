import React from 'react';
import { Text } from 'react-primitives';
import BiometryTypes from '@rainbow-me/helpers/biometryTypes';
import { useBiometryType } from '@rainbow-me/hooks';

const { Face, FaceID, Fingerprint, none, passcode, TouchID } = BiometryTypes;

export default function BiometryIcon(props) {
  const biometryType = useBiometryType();

  const isFace = biometryType === Face || biometryType === FaceID;
  const isPasscode = biometryType === passcode;
  const isTouch = biometryType === Fingerprint || biometryType === TouchID;

  return !biometryType || biometryType === none ? null : (
    <Text {...props}>
      {isFace ? '􀎽' : isTouch ? '􀟒' : isPasscode ? '􀒲' : null}
    </Text>
  );
}
