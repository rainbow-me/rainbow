import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import Divider from '../Divider';
import { Monospace } from '../text';
import { ListHeader } from '../list';

const enhance = onlyUpdateForKeys(['title', 'totalValue']);

const AssetListHeader = enhance(({
  title,
  totalValue,
  isSticky,
  ...props
}) => (
  <ListHeader isSticky={isSticky} title={title} {...props}>
    {totalValue ? (
      <Monospace size="larger" weight="semibold">
        {totalValue}
      </Monospace>
    ) : null}
  </ListHeader>
));

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
