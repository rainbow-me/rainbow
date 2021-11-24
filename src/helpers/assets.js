import {
  chunk,
  compact,
  concat,
  find,
  forEach,
  get,
  groupBy,
  includes,
  isEmpty,
  reduce,
  slice,
  sortBy,
} from 'lodash';
import { add, convertAmountToNativeDisplay, greaterThan } from './utilities';
import store from '@rainbow-me/redux/store';
import {
  ETH_ICON_URL,
  supportedNativeCurrencies,
} from '@rainbow-me/references';

const COINS_TO_SHOW = 5;

export const buildAssetUniqueIdentifier = item => {
  const balance = get(item, 'balance.amount', '');
  const nativePrice = get(item, 'native.price.display', '');
  const uniqueId = get(item, 'uniqueId');

  return compact([balance, nativePrice, uniqueId]).join('_');
};

const addEthPlaceholder = (
  assets,
  includePlaceholder,
  pinnedCoins,
  nativeCurrency,
  emptyCollectibles
) => {
  const hasEth = !!find(assets, asset => asset.address === 'eth');

  const { genericAssets } = store.getState().data;
  if (
    includePlaceholder &&
    !hasEth &&
    (assets.length > 0 || !emptyCollectibles)
  ) {
    const { relative_change_24h, value } = genericAssets?.eth?.price || {};

    const zeroEth = {
      address: 'eth',
      balance: {
        amount: '0',
        display: '0 ETH',
      },
      color: '#29292E',
      decimals: 18,
      icon_url: ETH_ICON_URL,
      isCoin: true,
      isPinned: pinnedCoins.includes('eth'),
      isPlaceholder: true,
      isSmall: false,
      name: 'Ethereum',
      native: {
        balance: {
          amount: '0.00',
          display: convertAmountToNativeDisplay('0.00', nativeCurrency),
        },
        change: relative_change_24h ? `${relative_change_24h.toFixed(2)}%` : '',
        price: {
          amount: value || '0.00',
          display: convertAmountToNativeDisplay(
            value ? value : '0.00',
            nativeCurrency
          ),
        },
      },
      price: value,
      symbol: 'ETH',
      type: 'token',
      uniqueId: 'eth',
    };

    return { addedEth: true, assets: concat([zeroEth], assets) };
  }
  return { addedEth: false, assets };
};

const getTotal = assets =>
  reduce(
    assets,
    (acc, asset) => {
      const balance = asset?.native?.balance?.amount ?? 0;
      return add(acc, balance);
    },
    0
  );

export const buildCoinsList = (
  assetsOriginal,
  nativeCurrency,
  isCoinListEdited,
  pinnedCoins,
  hiddenCoins,
  includePlaceholder = false,
  emptyCollectibles
) => {
  let standardAssets = [],
    pinnedAssets = [],
    smallAssets = [],
    hiddenAssets = [];

  const { addedEth, assets } = addEthPlaceholder(
    assetsOriginal,
    includePlaceholder,
    pinnedCoins,
    nativeCurrency,
    emptyCollectibles
  );

  // separate into standard, pinned, small balances, hidden assets
  forEach(assets, asset => {
    if (hiddenCoins && hiddenCoins.includes(asset.uniqueId)) {
      hiddenAssets.push({
        isCoin: true,
        isHidden: true,
        isSmall: true,
        ...asset,
      });
    } else if (pinnedCoins.includes(asset.uniqueId)) {
      pinnedAssets.push({
        isCoin: true,
        isPinned: true,
        isSmall: false,
        ...asset,
      });
    } else if (
      greaterThan(
        asset.native?.balance?.amount,
        supportedNativeCurrencies[nativeCurrency].smallThreshold
      )
    ) {
      standardAssets.push({ isCoin: true, isSmall: false, ...asset });
    } else {
      smallAssets.push({ isCoin: true, isSmall: true, ...asset });
    }
  });

  // decide which assets to show above or below the coin divider
  const nonHidden = concat(pinnedAssets, standardAssets);
  const dividerIndex = Math.max(pinnedAssets.length, COINS_TO_SHOW);

  let assetsAboveDivider = slice(nonHidden, 0, dividerIndex);
  let assetsBelowDivider = [];

  if (isEmpty(assetsAboveDivider)) {
    assetsAboveDivider = slice(smallAssets, 0, COINS_TO_SHOW);
    assetsBelowDivider = slice(smallAssets, COINS_TO_SHOW);
  } else {
    const remainderBelowDivider = slice(nonHidden, dividerIndex);
    assetsBelowDivider = concat(remainderBelowDivider, smallAssets);
  }

  // calculate small balance and overall totals
  const smallBalancesValue = getTotal(assetsBelowDivider);
  const bigBalancesValue = getTotal(assetsAboveDivider);
  const totalBalancesValue = add(bigBalancesValue, smallBalancesValue);

  // include hidden assets if in edit mode
  if (isCoinListEdited) {
    assetsBelowDivider = concat(assetsBelowDivider, hiddenAssets);
  }

  const allAssets = assetsAboveDivider;

  if (assetsBelowDivider.length > 0 || isCoinListEdited) {
    allAssets.push({
      coinDivider: true,
      value: smallBalancesValue,
    });
    allAssets.push({
      assets: assetsBelowDivider,
      smallBalancesContainer: true,
    });
  }

  return { addedEth, assets: allAssets, totalBalancesValue };
};

export const buildUniqueTokenList = (uniqueTokens, selectedShowcaseTokens) => {
  let rows = [];
  const showcaseTokens = [];
  const bundledShowcaseTokens = [];

  const grouped = groupBy(uniqueTokens, token => token.familyName);
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
    let tokens = compact(tokensRow);
    tokens = chunk(tokens, 50);
    // eslint-disable-next-line no-loop-func
    tokens.forEach((tokenChunk, index) => {
      const id = tokensRow[0]
        .map(({ uniqueId }) => uniqueId)
        .join(`__${index}`);
      rows.push({
        childrenAmount: grouped[families[i]].length,
        familyImage: get(tokensRow, '[0][0].familyImage', null),
        familyName: families[i],
        isHeader: index === 0,
        stableId: id,
        tokens: tokenChunk,
        uniqueId: id,
      });
    });
  }
  const regex = RegExp(/\s*(the)\s/, 'i');
  rows = sortBy(rows, row => row.familyName.replace(regex, '').toLowerCase());

  showcaseTokens.sort(function (a, b) {
    return (
      selectedShowcaseTokens?.indexOf(a.uniqueId) -
      selectedShowcaseTokens?.indexOf(b.uniqueId)
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
        isHeader: true,
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

export const buildUniqueTokenName = ({ collection, id, name }) =>
  name || `${collection.name} #${id}`;
