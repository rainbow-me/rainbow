import PropTypes from 'prop-types';
import React from 'react';
import { Monospace } from '../text';
import { ListHeader } from '../list';

const AssetListHeader = ({ section, totalValue, ...props }) => (
  <ListHeader {...props} {...section}>
    {totalValue ? (
      <Monospace size="large" weight="semibold">
        {totalValue}
      </Monospace>
    ) : null}
  </ListHeader>
);

AssetListHeader.propTypes = {
  totalValue: PropTypes.string,
};

AssetListHeader.height = ListHeader.height;

export default AssetListHeader;
