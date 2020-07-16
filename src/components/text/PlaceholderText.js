import React, { useImperativeHandle, useState } from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/primitives';
import Text from './Text';
import { colors } from '@rainbow-me/styles';

const Placeholder = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.3),
  size: 'big',
  weight: 'semibold',
})`
  margin-bottom: ${Platform.OS === 'android' ? -39 : -27};
  width: 100%;
`;

const PlaceholderText = (props, ref) => {
  const [value, updateValue] = useState(' ');
  useImperativeHandle(ref, () => ({ updateValue }));
  return <Placeholder ref={ref}>{value}</Placeholder>;
};

export default React.forwardRef(PlaceholderText);
