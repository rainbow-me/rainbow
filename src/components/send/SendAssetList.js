import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys, shouldUpdate } from 'recompact';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { FlyInAnimation } from '../animations';
import { RecyclerAssetList } from '../asset-list';
import { CoinRowHeight, CollectiblesSendRow, SendCoinRow } from '../coin-row';
import { ListFooter } from '../list';

const BalancesRenderItem = ({ item: { onSelectAsset, symbol, ...item } }) => (
  <SendCoinRow
    {...item}
    onPress={onSelectAsset(symbol)}
    symbol={symbol}
  />
);

BalancesRenderItem.propTypes = {
  item: PropTypes.shape({
    onSelectAsset: PropTypes.func,
    symbol: PropTypes.string,
  }),
};

const enhanceRenderItem = shouldUpdate((props, nextProps) => {
  const { data, item } = props;
  const { data: nextData, item: nextItem } = nextProps;

  const itemIdentifier = buildAssetUniqueIdentifier(item || data);
  const nextItemIdentifier = buildAssetUniqueIdentifier(nextItem || nextData);

  return itemIdentifier !== nextItemIdentifier;
});

const TokenItem = React.memo(enhanceRenderItem(BalancesRenderItem));
const UniqueTokenItem = React.memo(enhanceRenderItem(CollectiblesSendRow));

const balancesRenderItem = item => <TokenItem {...item} />;
const collectiblesRenderItem = item => <UniqueTokenItem {...item} />;

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
        paddingBottom={CoinRowHeight + ListFooter.height}
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

export default onlyUpdateForKeys(['allAssets', 'uniqueTokens'])(SendAssetList);
