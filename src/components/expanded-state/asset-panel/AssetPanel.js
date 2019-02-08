import PropTypes from 'prop-types';
import React, { Children, Fragment } from 'react';
import Divider from '../../Divider';
import FloatingPanel from '../FloatingPanel';

const AssetPanel = ({ children, ...props }) => (
  <FloatingPanel {...props} hideShadow>
    {Children.map(children, (child, index) => (
      <Fragment>
        {child}
        {(index < children.length - 1) && <Divider />}
      </Fragment>
    ))}
  </FloatingPanel>
);

AssetPanel.propTypes = {
  children: PropTypes.node,
};

export default AssetPanel;
