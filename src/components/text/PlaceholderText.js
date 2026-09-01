import React, { useImperativeHandle, useState } from 'react';

import { opacity } from '@/design-system/utils/opacity';
import styled from '@/framework/ui/styled-thing';

import Text from './Text';

const Placeholder = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: opacity(colors.blueGreyDark, 0.3),
  size: 'big',
  weight: 'semibold',
}))({
  marginBottom: -27,
  width: '100%',
});

const PlaceholderText = (props, ref) => {
  const [value, updateValue] = useState(' ');
  useImperativeHandle(ref, () => ({ updateValue }));
  return <Placeholder ref={ref}>{value}</Placeholder>;
};

export default React.forwardRef(PlaceholderText);
