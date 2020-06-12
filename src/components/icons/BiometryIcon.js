import React from 'react';
import styled from 'styled-components/primitives';
import BiometryTypes from '../../helpers/biometryTypes';
import { colors, position } from '../../styles';
import { magicMemo } from '../../utils';
import { Centered } from '../layout';
import Icon from './Icon';

const BiometryTypeIcon = styled(Icon).attrs(({ type }) => ({
  color: colors.white,
  name: type.toLowerCase(),
}))`
  ${position.size('100%')}
`;

const Container = styled(Centered).attrs({ align: 'start' })`
  ${({ type }) =>
    type === BiometryTypes.FaceID
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
    type === BiometryTypes.TouchID
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
