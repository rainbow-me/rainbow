import React, { useImperativeHandle, useState } from 'react';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import Text from './Text';

const Placeholder = styled(Text).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.3),
  size: 'big',
  weight: 'semibold',
})`
  margin-bottom: -27;
`;

const PlaceholderText = (props, ref) => {
  const [value, updateValue] = useState(' ');
  useImperativeHandle(ref, () => ({ updateValue }));
  return <Placeholder ref={ref}>{value}</Placeholder>;
};

export default React.forwardRef(PlaceholderText);
