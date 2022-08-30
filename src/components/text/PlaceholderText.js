import React, { useImperativeHandle, useState } from 'react';
import Text from './Text';
import styled from '@/styled-thing';

const Placeholder = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.3),
  size: 'big',
  weight: 'semibold',
}))({
  marginBottom: android ? -48 : -27,
  width: '100%',
});

const PlaceholderText = (props, ref) => {
  const [value, updateValue] = useState(' ');
  useImperativeHandle(ref, () => ({ updateValue }));
  return <Placeholder ref={ref}>{value}</Placeholder>;
};

export default React.forwardRef(PlaceholderText);
