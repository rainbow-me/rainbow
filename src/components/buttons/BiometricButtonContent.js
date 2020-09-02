import React from 'react';
import styled from 'styled-components/primitives';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { Text } from '../text';
import BiometryTypes from '@rainbow-me/helpers/biometryTypes';
import { useBiometryType } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';

const BiometryIcon = styled(Icon).attrs(({ biometryType, color }) => ({
  color,
  name: biometryType.toLowerCase(),
  size: biometryType === BiometryTypes.passcode ? 19 : 20,
}))`
  margin-bottom: ${({ biometryType }) =>
    biometryType === BiometryTypes.passcode ? 1.5 : 0};
`;

const ButtonLabel = styled(Text).attrs(({ color }) => ({
  align: 'center',
  color,
  letterSpacing: 'rounded',
  size: 'larger',
  weight: 'semibold',
}))``;

export default function BiometricButtonContent({
  color = colors.appleBlue,
  showIcon,
  text,
  ...props
}) {
  const biometryType = useBiometryType();
  const showBiometryIcon =
    showIcon &&
    (biometryType === BiometryTypes.passcode ||
      biometryType === BiometryTypes.TouchID);
  const showFaceIDCharacter = showIcon && biometryType === BiometryTypes.FaceID;

  return (
    <RowWithMargins centered margin={7} {...props}>
      {showBiometryIcon && (
        <BiometryIcon biometryType={biometryType} color={color} />
      )}
      <ButtonLabel color={color}>
        {showFaceIDCharacter && '􀎽 '}
        {text}
      </ButtonLabel>
    </RowWithMargins>
  );
}
