import PropTypes from 'prop-types';
import React from 'react';
import { FlyInAnimation } from '../animations';
import { AssetList } from '../asset-list';
import { SendCoinRow } from '../coin-row';
import { UniqueTokenRow } from '../unique-token';

const BalancesRenderItem = ({
  index,
  item: { symbol, ...item },
  section: { onSelectAsset },
}) => (
  <SendCoinRow
    {...item}
    onPress={onSelectAsset(symbol)}
    symbol={symbol}
  />
);

BalancesRenderItem.propTypes = {
  index: PropTypes.number,
  item: PropTypes.shape({ symbol: PropTypes.string }),
  section: PropTypes.shape({ onSelectAsset: PropTypes.func }),
};

const SendAssetList = ({
  allAssets,
  fetchData,
  onSelectAsset,
  uniqueTokens,
}) => {
  const sections = {
    balances: {
      data: allAssets,
      onSelectAsset,
      renderItem: BalancesRenderItem,
    },
    collectibles: {
      data: uniqueTokens,
      renderItem: UniqueTokenRow,
    },
  };

  return (
    <FlyInAnimation style={{ flex: 1, width: '100%' }}>
      <AssetList
        fetchData={fetchData}
        hideHeader
        sections={[sections.balances]}
      />
    </FlyInAnimation>
  );
};

SendAssetList.propTypes = {
  allAssets: PropTypes.array,
  fetchData: PropTypes.func,
  onSelectAsset: PropTypes.func,
  uniqueTokens: PropTypes.array,
};

export default SendAssetList;
