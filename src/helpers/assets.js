import { compact, forEach, get, groupBy, includes, sortBy } from 'lodash';
import supportedNativeCurrencies from '../references/native-currencies.json';
import { add } from './utilities';

export const amountOfShowedCoins = 5;

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

export const buildCoinsList = (
  assets,
  nativeCurrency,
  isCoinListEdited,
  pinnedCoins,
  hiddenCoins
) => {
  let standardAssets = [],
    pinnedAssets = [],
    hiddenAssets = [];
  const smallBalances = {
    assets: [],
    smallBalancesContainer: true,
  };
  const assetsLength = assets.length;

  let totalBalancesValue = 0;
  let smallBalancesValue = 0;

  const isShortList = assetsLength <= amountOfShowedCoins;

  forEach(assets, asset => {
    if (hiddenCoins && hiddenCoins.includes(asset.uniqueId)) {
      hiddenAssets.push({
        isCoin: true,
        isHidden: true,
        isSmall: true,
        ...asset,
      });
    } else if (pinnedCoins.includes(asset.uniqueId)) {
      totalBalancesValue = add(
        totalBalancesValue,
        get(asset, 'native.balance.amount', 0)
      );
      pinnedAssets.push({
        isCoin: true,
        isPinned: true,
        isSmall: false,
        ...asset,
      });
    } else if (
      (asset.native &&
        asset.native.balance.amount >
          supportedNativeCurrencies[nativeCurrency].smallThreshold) ||
      asset.address === 'eth' ||
      isShortList
    ) {
      totalBalancesValue = add(
        totalBalancesValue,
        get(asset, 'native.balance.amount', 0)
      );
      standardAssets.push({ isCoin: true, isSmall: false, ...asset });
    } else {
      smallBalancesValue = add(
        smallBalancesValue,
        get(asset, 'native.balance.amount', 0)
      );
      smallBalances.assets.push({ isCoin: true, isSmall: true, ...asset });
    }
  });

  totalBalancesValue = add(totalBalancesValue, smallBalancesValue);

  if (isCoinListEdited) {
    if (assetsLength <= amountOfShowedCoins) {
      standardAssets = standardAssets.concat(hiddenAssets);
    } else {
      smallBalances.assets = smallBalances.assets.concat(hiddenAssets);
    }
  }

  const allAssets = pinnedAssets.concat(standardAssets);
  const allAssetsLength = allAssets.length;
  const pinnedAssetsLength = pinnedAssets.length;
  if (
    amountOfShowedCoins > pinnedAssetsLength &&
    allAssetsLength > amountOfShowedCoins
  ) {
    smallBalances.assets = allAssets
      .splice(amountOfShowedCoins)
      .concat(smallBalances.assets);
  } else if (
    amountOfShowedCoins <= pinnedAssetsLength &&
    allAssetsLength >= pinnedAssetsLength
  ) {
    smallBalances.assets = allAssets
      .splice(pinnedAssetsLength)
      .concat(smallBalances.assets);
  }

  if (
    smallBalances.assets.length > 0 ||
    (hiddenAssets.length > 0 && assetsLength > amountOfShowedCoins) ||
    (pinnedAssetsLength === allAssetsLength &&
      allAssetsLength > amountOfShowedCoins)
  ) {
    allAssets.push({
      assetsAmount: smallBalances.assets.length,
      coinDivider: true,
      value: smallBalancesValue,
    });
    allAssets.push(smallBalances);
  }

  return { assets: allAssets, totalBalancesValue };
};

export const buildUniqueTokenList = (uniqueTokens, selectedShowcaseTokens) => {
  let rows = [];
  const showcaseTokens = [];
  const bundledShowcaseTokens = [];

  const grouped = groupBy(uniqueTokens, token => token.asset_contract.name);
  const families = Object.keys(grouped);

  for (let i = 0; i < families.length; i++) {
    const tokensRow = [];
    for (let j = 0; j < grouped[families[i]].length; j += 2) {
      if (includes(selectedShowcaseTokens, grouped[families[i]][j].uniqueId)) {
        showcaseTokens.push(grouped[families[i]][j]);
      }
      if (grouped[families[i]][j + 1]) {
        if (
          includes(selectedShowcaseTokens, grouped[families[i]][j + 1].uniqueId)
        ) {
          showcaseTokens.push(grouped[families[i]][j + 1]);
        }
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

  showcaseTokens.sort(function(a, b) {
    return (
      selectedShowcaseTokens.indexOf(a.uniqueId) -
      selectedShowcaseTokens.indexOf(b.uniqueId)
    );
  });

  for (let i = 0; i < showcaseTokens.length; i += 2) {
    if (showcaseTokens[i + 1]) {
      bundledShowcaseTokens.push([showcaseTokens[i], showcaseTokens[i + 1]]);
    } else {
      bundledShowcaseTokens.push([showcaseTokens[i]]);
    }
  }
  if (showcaseTokens.length > 0) {
    rows = [
      {
        childrenAmount: showcaseTokens.length,
        familyName: 'Showcase',
        stableId: 'showcase_stable_id',
        tokens: bundledShowcaseTokens,
        uniqueId: `sc_${showcaseTokens
          .map(({ uniqueId }) => uniqueId)
          .join('__')}`,
      },
    ].concat(rows);
  }

  rows.forEach((row, i) => {
    row.familyId = i;
    row.tokens[0][0].rowNumber = i;
  });
  return rows;
};

export const buildUniqueTokenName = ({ asset_contract, id, name }) =>
  name || `${asset_contract.name} #${id}`;
