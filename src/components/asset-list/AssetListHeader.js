import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import Divider from '../Divider';
import { ListHeader } from '../list';
import { H1 } from '../text';

const enhance = onlyUpdateForKeys([
  'title',
  'totalValue',
  'contextMenuOptions',
]);

const AssetListHeader = enhance(
  ({ title, totalValue, isSticky, contextMenuOptions, ...props }) => {
    return (
      <ListHeader
        isSticky={isSticky}
        title={title}
        contextMenuOptions={contextMenuOptions}
        {...props}
      >
        {totalValue ? (
          <H1 letterSpacing="roundedTight" weight="semibold">
            {totalValue}
          </H1>
        ) : null}
      </ListHeader>
    );
  }
);

AssetListHeader.propTypes = {
  isSticky: PropTypes.bool,
  title: PropTypes.string,
  totalValue: PropTypes.string,
};

AssetListHeader.defaultProps = {
  isSticky: false,
};

AssetListHeader.height = ListHeader.height + Divider.size;

export default AssetListHeader;
