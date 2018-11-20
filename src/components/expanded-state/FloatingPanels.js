import PropTypes from 'prop-types';
import React, { Children, cloneElement } from 'react';
import { Column } from '../layout';

const FloatingPanels = ({ children }) => (
  <Column style={{ width: '100%' }}>
    {Children.map(children, (child, index) =>
      cloneElement(child, {
        style: {
          marginBottom: (index < children.length - 1) ? 20 : 0,
        },
      }))}
  </Column>
);

FloatingPanels.propTypes = {
  children: PropTypes.node,
};

export default FloatingPanels;
