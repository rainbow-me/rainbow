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
  'isCoinListEdited',
]);

const AssetListHeader = enhance(
  ({
    contextMenuOptions,
    isCoinListEdited,
    isSticky,
    title,
    totalValue,
    ...props
  }) => {
    return (
      <ListHeader
        contextMenuOptions={contextMenuOptions}
        isCoinListEdited={isCoinListEdited}
        isSticky={isSticky}
        title={title}
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
  contextMenuOptions: PropTypes.object,
  isCoinListEdited: PropTypes.bool,
  isSticky: PropTypes.bool,
  title: PropTypes.string,
  totalValue: PropTypes.string,
};

AssetListHeader.defaultProps = {
  isSticky: false,
};

AssetListHeader.height = ListHeader.height + Divider.size;

export default AssetListHeader;
