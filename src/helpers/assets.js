import { compact, get, groupBy, sortBy } from 'lodash';
import store from '../redux/store';

const amountOfShowedCoins = 5;

export const buildAssetHeaderUniqueIdentifier = ({
  title,
  totalItems,
  totalValue,
}) => compact([title, totalItems, totalValue]).join('_');

export const buildAssetUniqueIdentifier = item => {
  const balance = get(item, 'balance.amount', '');
  const nativePrice = get(item, 'native.price.display', '');
  const uniqueId = get(item, 'uniqueId');

  return compact([balance, nativePrice, uniqueId]).join('_');
};

export const buildCoinsList = assets => {
  let standardAssets = [],
    pinnedAssets = [],
    hiddenAssets = [];
  const { pinnedCoins, hiddenCoins } = store.getState().editOptions;
  const smallBalances = {
    assets: [],
    smallBalancesContainer: true,
  };
  let smallBalancesValue = 0;
  for (let i = 0; i < assets.length; i++) {
    if (hiddenCoins.includes(assets[i].uniqueId)) {
      hiddenAssets.push({
        isCoin: true,
        isHidden: true,
        isSmall: true,
        ...assets[i],
      });
    } else if (pinnedCoins.includes(assets[i].uniqueId)) {
      pinnedAssets.push({
        isCoin: true,
        isPinned: true,
        isSmall: false,
        ...assets[i],
      });
    } else if (
      (assets[i].native && assets[i].native.balance.amount > 1) ||
      assets[i].address === 'eth' ||
      assets.length < 5
    ) {
      standardAssets.push({ isCoin: true, isSmall: false, ...assets[i] });
    } else {
      smallBalancesValue += Number(get(assets[i], 'native.balance.amount', 0));
      smallBalances.assets.push({ isCoin: true, isSmall: true, ...assets[i] });
    }
  }

  if (store.getState().editOptions.isCoinListEdited) {
    if (assets.length < 5) {
      standardAssets = standardAssets.concat(hiddenAssets);
    } else {
      smallBalances.assets = smallBalances.assets.concat(hiddenAssets);
    }
  }

  const allAssets = pinnedAssets.concat(standardAssets);
  if (
    amountOfShowedCoins > pinnedAssets.length &&
    allAssets.length > amountOfShowedCoins
  ) {
    smallBalances.assets = allAssets
      .splice(amountOfShowedCoins)
      .concat(smallBalances.assets);
  } else if (
    amountOfShowedCoins <= pinnedAssets.length &&
    allAssets.length >= pinnedAssets.length
  ) {
    smallBalances.assets = allAssets
      .splice(pinnedAssets.length)
      .concat(smallBalances.assets);
  }

  if (
    smallBalances.assets.length > 0 ||
    (pinnedAssets.length === allAssets.length && allAssets.length > 4)
  ) {
    allAssets.push({
      assetsAmount: smallBalances.assets.length,
      coinDivider: true,
      value: smallBalancesValue,
    });
    allAssets.push(smallBalances);
  }

  return allAssets;
};

export const buildUniqueTokenList = uniqueTokens => {
  let rows = [];

  const grouped = groupBy(uniqueTokens, token => token.asset_contract.name);
  const families = Object.keys(grouped);

  for (let i = 0; i < families.length; i++) {
    const tokensRow = [];
    for (let j = 0; j < grouped[families[i]].length; j += 2) {
      if (grouped[families[i]][j + 1]) {
        tokensRow.push([grouped[families[i]][j], grouped[families[i]][j + 1]]);
      } else {
        tokensRow.push([grouped[families[i]][j]]);
      }
    }
    const tokens = compact(tokensRow);
    rows.push({
      childrenAmount: grouped[families[i]].length,
      familyImage: get(tokensRow, '[0][0].familyImage', null),
      familyName: families[i],
      stableId: tokensRow[0].map(({ uniqueId }) => uniqueId).join('__'),
      tokens,
      uniqueId: tokensRow[0].map(({ uniqueId }) => uniqueId).join('__'),
    });
  }

  rows = sortBy(rows, ['familyName']);
  rows.forEach((row, i) => {
    row.familyId = i;
    row.tokens[0][0].rowNumber = i;
  });
  return rows;
};

export const buildUniqueTokenName = ({ asset_contract, id, name }) =>
  name || `${asset_contract.name} #${id}`;
