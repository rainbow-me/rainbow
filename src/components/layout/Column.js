import React from 'react';
import Flex from './Flex';

const Column = (props, ref) => <Flex direction="column" ref={ref} {...props} />;

export default React.forwardRef(Column);
