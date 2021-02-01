import React from 'react';
import styled from 'styled-components';
import { Centered } from '../layout';
import Icon from './Icon';
import BiometryTypes from '@rainbow-me/helpers/biometryTypes';
import { position } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const BiometryTypeIcon = styled(Icon).attrs(({ type, theme: { colors } }) => ({
  color: colors.whiteLabel,
  name: type.toLowerCase(),
}))`
  ${position.size('100%')}
`;

const Container = styled(Centered).attrs({
  align: 'start',
})`
  ${({ type }) =>
    type === BiometryTypes.FaceID || type === BiometryTypes.Face
      ? `
        ${position.size(27)};
        margin-bottom: 2;
        margin-left: 4;
      `
      : ''}

  ${({ type }) =>
    type === BiometryTypes.passcode
      ? `
        height: 25;
        margin-bottom: 4;
        margin-left: 4;
        width: 18;
      `
      : ''}

  ${({ type }) =>
    type === BiometryTypes.TouchID || type === BiometryTypes.Fingerprint
      ? `
        ${position.size(31)};
        margin-bottom: 1;
      `
      : ''}
`;

const BiometryIcon = ({ biometryType, ...props }) =>
  !biometryType || biometryType === 'none' ? null : (
    <Container {...props} type={biometryType}>
      <BiometryTypeIcon type={biometryType} />
    </Container>
  );

export default magicMemo(BiometryIcon, 'biometryType');
