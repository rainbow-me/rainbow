import PropTypes from 'prop-types';
import React from 'react';
import lang from 'i18n-js';
import { FlyInAnimation } from '../animations';
import AssetList from '../asset-list/RecyclerAssetList';
import { SendCoinRow } from '../coin-row';
import CollectiblesSendRow from '../coin-row/CollectiblesSendRow';

const BalancesRenderItem = ({
  index,
  item: { onSelectAsset, symbol, ...item },
}) => (
  <SendCoinRow
    {...item}
    onPress={onSelectAsset(symbol)}
    symbol={symbol}
  />
);

const collectiblesRenderItem = CollectiblesSendRow

BalancesRenderItem.propTypes = {
  index: PropTypes.number,
  item: PropTypes.shape({
    symbol: PropTypes.string,
    onSelectAsset: PropTypes.func
  }),
};

const SendAssetList = ({
  allAssets,
  fetchData,
  onSelectAsset,
  uniquetokens: uniqueTokens,
}) => {
  const sections = [
    {
      balances: true,
      data: allAssets,
      perData: {
        onSelectAsset,
      },
      renderItem: BalancesRenderItem,
    },
    {
      collectibles: true,
      data: uniqueTokens,
      header: {
        title: lang.t('account.tab_collectibles'),
      },
      perData: {
        onSelectAsset,
      },
      renderItem: collectiblesRenderItem,
      type: 'small',
    },
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
