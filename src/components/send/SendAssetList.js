import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys, shouldUpdate } from 'recompact';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { deviceUtils } from '../../utils';
import { FlyInAnimation } from '../animations';
import { RecyclerAssetList } from '../asset-list';
import { CoinRow, CollectiblesSendRow, SendCoinRow } from '../coin-row';
import { ListFooter } from '../list';

const CollectiblesRenderItem = ({ item: { onSelectAsset, ...item } }) => (
  <CollectiblesSendRow
    item={item}
    onPress={onSelectAsset(item)}
  />
);

const BalancesRenderItem = ({ item: { onSelectAsset, symbol, ...item } }) => (
  <SendCoinRow
    item={item}
    onPress={onSelectAsset(symbol)}
    symbol={symbol}
  />
);

CollectiblesRenderItem.propTypes = {
  item: PropTypes.shape({
    onSelectAsset: PropTypes.func
  }),
};

BalancesRenderItem.propTypes = {
  item: PropTypes.shape({
    onSelectAsset: PropTypes.func,
    symbol: PropTypes.string,
  }),
};

const enhanceRenderItem = shouldUpdate((props, nextProps) => {
  const { item } = props;
  const { item: nextItem } = nextProps;

  const itemIdentifier = buildAssetUniqueIdentifier(item);
  const nextItemIdentifier = buildAssetUniqueIdentifier(nextItem);

  return itemIdentifier !== nextItemIdentifier;
});

const TokenItem = React.memo(enhanceRenderItem(BalancesRenderItem));
const UniqueTokenItem = React.memo(enhanceRenderItem(CollectiblesRenderItem));

const balancesRenderItem = item => <TokenItem {...item} />;
const collectiblesRenderItem = item => <UniqueTokenItem {...item} />;

const SendAssetList = ({
  allAssets,
  fetchData,
  onSelectAsset,
  uniqueTokens,
}) => {
  const sections = [
    {
      balances: true,
      data: allAssets,
      perData: {
        onSelectAsset,
      },
      renderItem: balancesRenderItem,
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
      <RecyclerAssetList
        fetchData={fetchData}
        hideHeader
        paddingBottom={CoinRow.height + ListFooter.height}
        renderAheadOffset={deviceUtils.dimensions.height * 1.5}
        sections={sections}
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

export default onlyUpdateForKeys(['allAssets', 'uniqueTokens'])(SendAssetList);
