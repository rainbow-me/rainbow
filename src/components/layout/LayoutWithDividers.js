import PropTypes from 'prop-types';
import React, { Children, cloneElement, createElement, Fragment } from 'react';
import Divider from '../Divider';
import Flex from './Flex';

const LayoutWithDividers = ({
  children,
  dividerProps,
  dividerRenderer,
  ...props
}) => (
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

LayoutWithDividers.propTypes = {
  children: PropTypes.node,
  dividerProps: PropTypes.object,
  dividerRenderer: PropTypes.func,
};

LayoutWithDividers.defaultProps = {
  dividerRenderer: Divider,
};

export default LayoutWithDividers;
