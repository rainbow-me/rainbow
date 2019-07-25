import PropTypes from 'prop-types';
import React, {
  Children,
  cloneElement,
  createElement,
  Fragment,
} from 'react';
import Flex from './Flex';
import Divider from '../Divider';

const LayoutWithDividers = ({
  children,
  dividerProps,
  dividerRenderer,
  ...props
}) => (
  <Flex {...props}>
    {Children.toArray(children).map((child, index, array) => (
      <Fragment key={index}>
        {cloneElement(child)}
        {(index < array.length - 1)
          ? createElement(dividerRenderer, dividerProps)
          : null
        }
      </Fragment>
    ))}
  </Flex>
);

LayoutWithDividers.propTypes = {
  children: PropTypes.node,
  dividerProps: PropTypes.object,
  dividerRenderer: PropTypes.func,
};

LayoutWithDividers.defaultProps = {
  dividerRenderer: Divider,
};

export default LayoutWithDividers;
