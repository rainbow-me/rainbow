import React, { Children, cloneElement, useMemo } from 'react';
import flattenChildren from 'react-flatten-children';
import Flex from './Flex';

const LayoutWithMargins = ({ children, direction, margin, marginKey, ...props }, ref) => {
  const marginValues = useMemo(() => {
    const reverse = direction.includes('reverse');
    return [reverse ? 0 : margin, reverse ? margin : 0];
  }, [direction, margin]);

  return (
    <Flex {...props} direction={direction} ref={ref}>
      {Children.toArray(flattenChildren(children)).map((child, index, array) =>
        cloneElement(child, {
          style: [child?.props?.style, { [marginKey]: marginValues[index < array.length - 1 ? 0 : 1] }],
        })
      )}
    </Flex>
  );
};

export default React.forwardRef(LayoutWithMargins);
