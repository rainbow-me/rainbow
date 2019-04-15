import PropTypes from 'prop-types';
import React from 'react';
import { FlyInAnimation } from '../animations';
import AssetList from '../asset-list/RecyclerAssetList';
import { SendCoinRow } from '../coin-row';

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
  //uniquetokens: uniqueTokens,
}) => {
  const sections = [
    {
      balances: true,
      data: allAssets,
      onSelectAsset,
      renderItem: BalancesRenderItem,
    },
    // {
    //   collectibles: true,
    //   data: buildUniqueTokenList(uniqueTokens),
    //   renderItem: BalancesRenderItem,
    //   title: lang.t('account.tab_collectibles'),
    // },
  ];

  return (
    <FlyInAnimation style={{ flex: 1, width: '100%' }}>
      <AssetList
        fetchData={fetchData}
        hideHeader
        sections={sections}
      />
    </FlyInAnimation>
  );
};

SendAssetList.propTypes = {
  allAssets: PropTypes.array,
  fetchData: PropTypes.func,
  onSelectAsset: PropTypes.func,
  uniquetokens: PropTypes.array,
};

export default SendAssetList;
