import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Children, cloneElement } from 'react';
import flattenChildren from 'react-flatten-children';
import Flex from './Flex';

const LayoutWithMargins = ({ children, margin, marginKey, ...props }) => (
  <Flex {...props}>
    {Children.toArray(flattenChildren(children)).map((child, index, array) =>
      cloneElement(child, {
        style: {
          ...get(child, 'props.style', {}),
          [marginKey]: index < array.length - 1 ? margin : 0,
        },
      })
    )}
  </Flex>
);

LayoutWithMargins.propTypes = {
  children: PropTypes.node,
  margin: PropTypes.number.isRequired,
  marginKey: PropTypes.string.isRequired,
};

export default LayoutWithMargins;
