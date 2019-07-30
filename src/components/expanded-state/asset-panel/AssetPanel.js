import PropTypes from 'prop-types';
import React from 'react';
import { ColumnWithDividers } from '../../layout';
import FloatingPanel from '../FloatingPanel';

const AssetPanel = ({ children, ...props }) => (
  <FloatingPanel {...props} hideShadow>
    <ColumnWithDividers>
      {children}
    </ColumnWithDividers>
  </FloatingPanel>
);

AssetPanel.propTypes = {
  children: PropTypes.node,
};

export default React.memo(AssetPanel);
