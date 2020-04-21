import React from 'react';
import Flex from './Flex';

const Centered = (props, ref) => (
  <Flex align="center" justify="center" ref={ref} {...props} />
);

export default React.forwardRef(Centered);
