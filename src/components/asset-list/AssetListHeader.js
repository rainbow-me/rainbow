import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import Divider from '../Divider';
import { Monospace } from '../text';
import { ListHeader } from '../list';

const enhance = onlyUpdateForKeys(['showShitcoins', 'title', 'totalValue']);

const AssetListHeader = enhance(({
  showShitcoins,
  title,
  totalValue,
  ...props
}) => (
  <ListHeader showShitcoins={showShitcoins} title={title} {...props}>
    {totalValue ? (
      <Monospace size="larger" weight="semibold">
        {totalValue}
      </Monospace>
    ) : null}
  </ListHeader>
));

AssetListHeader.propTypes = {
  showShitcoins: PropTypes.bool,
  title: PropTypes.string,
  totalValue: PropTypes.string,
};

AssetListHeader.height = ListHeader.height + Divider.size;

export default AssetListHeader;
