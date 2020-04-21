import React from 'react';
import Flex from './Flex';

const Row = (props, ref) => <Flex direction="row" ref={ref} {...props} />;

export default React.forwardRef(Row);
