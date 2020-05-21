import PropTypes from 'prop-types';
import React, {
  Children,
  cloneElement,
  createElement,
  Fragment,
  useMemo,
} from 'react';
import Divider from '../Divider';
import Flex from './Flex';

const LayoutWithDividers = ({
  children,
  dividerHorizontal,
  dividerRenderer,
  ...props
}) => {
  const dividerProps = useMemo(() => ({ horizontal: dividerHorizontal }), [
    dividerHorizontal,
  ]);

  return (
    <Flex {...props}>
      {Children.toArray(children).map((child, index, array) => (
        // eslint-disable-next-line react/no-array-index-key
        <Fragment key={index}>
          {cloneElement(child)}
          {index < array.length - 1
            ? createElement(dividerRenderer, dividerProps)
            : null}
        </Fragment>
      ))}
    </Flex>
  );
};

LayoutWithDividers.propTypes = {
  children: PropTypes.node,
  dividerHorizontal: PropTypes.bool,
  dividerRenderer: PropTypes.func,
};

LayoutWithDividers.defaultProps = {
  dividerRenderer: Divider,
};

export default LayoutWithDividers;
