import React, { useImperativeHandle, useState } from 'react';
import styled from 'styled-components';
import Text from './Text';

const Placeholder = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.3),
  size: 'big',
  weight: 'semibold',
}))`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-bottom: ${android ? -48 : -27};
  width: 100%;
`;

const PlaceholderText = (props: any, ref: any) => {
  const [value, updateValue] = useState(' ');
  useImperativeHandle(ref, () => ({ updateValue }));
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <Placeholder ref={ref}>{value}</Placeholder>;
};

export default React.forwardRef(PlaceholderText);
