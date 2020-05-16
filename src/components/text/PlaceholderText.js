import React, { useImperativeHandle, useState } from 'react';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { Text } from '.';

const Placeholder = styled(Text).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.3),
  size: 'big',
  weight: 'semibold',
})`
  margin-bottom: -27;
`;

const PlaceholderText = (props, ref) => {
  const [text, setText] = useState(' ');

  useImperativeHandle(ref, () => ({
    updateValue: newText => setText(newText),
  }));

  return <Placeholder ref={ref}>{text}</Placeholder>;
};

export default React.forwardRef(PlaceholderText);
