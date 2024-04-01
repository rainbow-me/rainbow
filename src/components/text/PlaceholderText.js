import React, { useImperativeHandle, useState } from 'react';
import Text from './Text';
import { useForegroundColor } from '@/design-system';

const PlaceholderText = (props, ref) => {
  const [value, updateValue] = useState(' ');
  const labelQuaternary = useForegroundColor('labelQuaternary');
  useImperativeHandle(ref, () => ({ updateValue }));
  return (
    <Text
      align="center"
      color={labelQuaternary}
      size="big"
      weight="semibold"
      style={{ marginBottom: android ? -48 : -27, width: '100%' }}
      ref={ref}
    >
      {value}
    </Text>
  );
};

export default React.forwardRef(PlaceholderText);
