import React, { Children, createElement, Fragment, useMemo } from 'react';
import Divider from '../Divider';
import Flex from './Flex';

const LayoutWithDividers = ({ children, dividerHorizontal, dividerRenderer = Divider, ...props }, ref) => {
  const dividerProps = useMemo(() => ({ horizontal: dividerHorizontal }), [dividerHorizontal]);

  return (
    <Flex {...props} ref={ref}>
      {Children.toArray(children).map((child, index, array) => (
        <Fragment key={index}>
          {child}
          {index < array.length - 1 ? createElement(dividerRenderer, dividerProps) : null}
        </Fragment>
      ))}
    </Flex>
  );
};

export default React.forwardRef(LayoutWithDividers);
