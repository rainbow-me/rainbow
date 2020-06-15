import React, { Children, cloneElement } from 'react';
import flattenChildren from 'react-flatten-children';
import Flex from './Flex';

const LayoutWithMargins = ({ children, margin, marginKey, ...props }, ref) => (
  <Flex {...props} ref={ref}>
    {Children.toArray(flattenChildren(children)).map((child, index, array) =>
      cloneElement(child, {
        style: [
          child?.props?.style,
          { [marginKey]: index < array.length - 1 ? margin : 0 },
        ],
      })
    )}
  </Flex>
);

export default React.forwardRef(LayoutWithMargins);
