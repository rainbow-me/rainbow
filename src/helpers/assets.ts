import lang from 'i18n-js';
import { chunk, compact, groupBy, isEmpty, slice, sortBy } from 'lodash';
import { add, greaterThan } from './utilities';
import { AssetListType } from '@/components/asset-list/RecyclerAssetList2';
import { supportedNativeCurrencies } from '@/references';
import { getUniqueTokenFormat, getUniqueTokenType } from '@/utils';
import * as i18n from '@/languages';
import * as ls from '@/storage';
import { UniqueAsset } from '@/entities';
import { CollectibleSortByOptions } from '@/hooks/useNFTsSortBy';

const COINS_TO_SHOW = 5;

export const buildAssetUniqueIdentifier = (item: any) => {
  const balance = item?.balance?.amount ?? '';
  const nativePrice = item?.native?.price?.display ?? '';
  const uniqueId = item?.uniqueId;

  return compact([balance, nativePrice, uniqueId]).join('_');
};

const getTotal = (assets: any) =>
  // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
  assets.reduce((acc, asset) => {
    const balance = asset?.native?.balance?.amount ?? 0;
    return add(acc, balance);
  }, 0);

export const buildCoinsList = (sortedAssets: any, nativeCurrency: any, isCoinListEdited: any, pinnedCoins: any, hiddenCoins: any) => {
  if (!sortedAssets.length) {
    return {
      assets: [],
      smallBalancesValue: 0,
      totalBalancesValue: 0,
    };
  }

  const standardAssets: any = [],
    pinnedAssets: any = [],
    smallAssets: any = [],
    hiddenAssets: any = [];

  // separate into standard, pinned, small balances, hidden assets
  sortedAssets?.forEach((asset: any) => {
    if (!!hiddenCoins && hiddenCoins[asset.uniqueId]) {
      hiddenAssets.push({
        isCoin: true,
        isHidden: true,
        isSmall: true,
        ...asset,
      });
    } else if (pinnedCoins[asset.uniqueId]) {
      pinnedAssets.push({
        isCoin: true,
        isPinned: true,
        isSmall: false,
        ...asset,
      });
    } else if (
      greaterThan(
        asset.native?.balance?.amount,
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        supportedNativeCurrencies[nativeCurrency].smallThreshold
      )
    ) {
      standardAssets.push({ isCoin: true, isSmall: false, ...asset });
    } else {
      smallAssets.push({ isCoin: true, isSmall: true, ...asset });
    }
  });

  // decide which assets to show above or below the coin divider
  // FIXME: Parameter 'allAssets' implicitly has an 'any' type.
  const nonHidden = pinnedAssets.concat(standardAssets) as any[];
  const dividerIndex = Math.max(pinnedAssets.length, COINS_TO_SHOW);

  let assetsAboveDivider = slice(nonHidden, 0, dividerIndex);
  let assetsBelowDivider = [];

  if (isEmpty(assetsAboveDivider)) {
    assetsAboveDivider = slice(smallAssets, 0, COINS_TO_SHOW);
    assetsBelowDivider = slice(smallAssets, COINS_TO_SHOW);
  } else {
    const remainderBelowDivider = slice(nonHidden, dividerIndex);
    assetsBelowDivider = remainderBelowDivider.concat(smallAssets);
  }

  // calculate small balance and overall totals
  const smallBalancesValue = getTotal(assetsBelowDivider);
  const bigBalancesValue = getTotal(assetsAboveDivider);
  const totalBalancesValue = add(bigBalancesValue, smallBalancesValue);

  const defaultToEditButton = assetsBelowDivider.length === 0;
  // include hidden assets if in edit mode
  if (isCoinListEdited) {
    assetsBelowDivider = assetsBelowDivider.concat(hiddenAssets);
  }
  const allAssets = assetsAboveDivider;

  allAssets.push({
    coinDivider: true,
    defaultToEditButton: defaultToEditButton,
    value: smallBalancesValue,
  });

  if (assetsBelowDivider.length > 0) {
    allAssets.push({
      assets: assetsBelowDivider,
      smallBalancesContainer: true,
    });
  }

  return {
    assets: allAssets,
    smallBalancesValue,
    totalBalancesValue,
  };
};

// TODO make it better
export const buildBriefCoinsList = (sortedAssets: any, nativeCurrency: any, isCoinListEdited: any, pinnedCoins: any, hiddenCoins: any) => {
  const { assets, smallBalancesValue, totalBalancesValue } = buildCoinsList(
    sortedAssets,
    nativeCurrency,
    isCoinListEdited,
    pinnedCoins,
    hiddenCoins
  );
  const briefAssets = [];
  if (assets) {
    for (const asset of assets) {
      if (asset.coinDivider) {
        briefAssets.push({
          defaultToEditButton: asset.defaultToEditButton,
          type: 'COIN_DIVIDER',
          uid: 'coin-divider',
          value: smallBalancesValue,
        });
      } else if (asset.smallBalancesContainer) {
        for (const smallAsset of asset.assets) {
          briefAssets.push({
            type: 'COIN',
            uid: 'coin-' + smallAsset.uniqueId,
            uniqueId: smallAsset.uniqueId,
          });
        }
      } else {
        briefAssets.push({
          type: 'COIN',
          uid: 'coin-' + asset.uniqueId,
          uniqueId: asset.uniqueId,
        });
      }
    }
  }

  return { briefAssets, totalBalancesValue };
};

interface Dictionary<T> {
  [index: string]: T;
}

export const buildUniqueTokenList = (uniqueTokens: any, selectedShowcaseTokens: any[] = []) => {
  let rows: any = [];
  const showcaseTokens = [];
  const bundledShowcaseTokens = [];

  const grouped = groupBy(uniqueTokens, token => token.familyName);
  const families = Object.keys(grouped);

  for (const family of families) {
    const tokensRow: any = [];
    for (let j = 0; j < grouped[family].length; j += 2) {
      if (selectedShowcaseTokens.includes(grouped[family][j].uniqueId)) {
        showcaseTokens.push(grouped[family][j]);
      }
      if (grouped[family][j + 1]) {
        if (selectedShowcaseTokens.includes(grouped[family][j + 1].uniqueId)) {
          showcaseTokens.push(grouped[family][j + 1]);
        }
        tokensRow.push([grouped[family][j], grouped[family][j + 1]]);
      } else {
        tokensRow.push([grouped[family][j]]);
      }
    }
    let tokens = compact(tokensRow);
    tokens = chunk(tokens, 50);
    // eslint-disable-next-line no-loop-func
    tokens.forEach((tokenChunk, index) => {
      const id = tokensRow[0].map(({ uniqueId }: any) => uniqueId).join(`__${index}`);
      rows.push({
        childrenAmount: grouped[family].length,
        familyImage: tokensRow?.[0]?.[0]?.familyImage ?? null,
        familyName: family,
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
    return selectedShowcaseTokens?.indexOf(a.uniqueId) - selectedShowcaseTokens?.indexOf(b.uniqueId);
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
        familyName: i18n.t(i18n.l.account.tab_showcase),
        isHeader: true,
        stableId: 'showcase_stable_id',
        tokens: bundledShowcaseTokens,
        uniqueId: `sc_${showcaseTokens.map(({ uniqueId }) => uniqueId).join('__')}`,
      },
    ].concat(rows);
  }

  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'row' implicitly has an 'any' type.
  rows.forEach((row, i) => {
    row.familyId = i;
    row.tokens[0][0].rowNumber = i;
  });
  return rows;
};

const regex = RegExp(/\s*(the)\s/, 'i');

const sortCollectibles = (assetsByName: Dictionary<UniqueAsset[]>, collectibleSortBy: string) => {
  const families = Object.keys(assetsByName);

  switch (collectibleSortBy) {
    case CollectibleSortByOptions.MOST_RECENT:
      return families.sort((a, b) => {
        const maxDateA = Math.max(Number(...assetsByName[a].map(asset => asset.acquisition_date)));
        const maxDateB = Math.max(Number(...assetsByName[b].map(asset => asset.acquisition_date)));
        return maxDateB - maxDateA;
      });
    case CollectibleSortByOptions.ABC:
      return families.sort((a, b) => a.replace(regex, '').toLowerCase().localeCompare(b.replace(regex, '').toLowerCase()));
    case CollectibleSortByOptions.FLOOR_PRICE:
      return families.sort((a, b) => {
        const minPriceA = Math.min(...assetsByName[a].map(asset => (asset.floorPriceEth !== undefined ? asset.floorPriceEth : -1)));
        const minPriceB = Math.min(...assetsByName[b].map(asset => (asset.floorPriceEth !== undefined ? asset.floorPriceEth : -1)));
        return minPriceB - minPriceA;
      });
    default:
      return families;
  }
};

export const buildBriefUniqueTokenList = (
  uniqueTokens: any,
  selectedShowcaseTokens: any,
  sellingTokens: any[] = [],
  hiddenTokens: string[] = [],
  listType: AssetListType = 'wallet',
  isReadOnlyWallet = false,
  nftSort: string = CollectibleSortByOptions.MOST_RECENT
) => {
  const hiddenUniqueTokensIds = uniqueTokens
    .filter(({ fullUniqueId }: any) => hiddenTokens.includes(fullUniqueId))
    .map(({ uniqueId }: any) => uniqueId);
  const nonHiddenUniqueTokens = uniqueTokens.filter(({ fullUniqueId }: any) => !hiddenTokens.includes(fullUniqueId));
  const uniqueTokensInShowcaseIds = nonHiddenUniqueTokens
    .filter(({ uniqueId }: any) => selectedShowcaseTokens?.includes(uniqueId))
    .map(({ uniqueId }: any) => uniqueId);

  const filteredUniqueTokens = nonHiddenUniqueTokens.filter((token: any) => {
    if (listType === 'select-nft') {
      const format = getUniqueTokenFormat(token);
      const type = getUniqueTokenType(token);
      return format === 'image' && type === 'NFT';
    }
    return true;
  });

  // group the assets by collection name
  const assetsByName = groupBy(filteredUniqueTokens, token => token.familyName);

  // depending on the sort by option, sort the collections
  const families2 = sortCollectibles(assetsByName, nftSort);

  const result = [
    {
      type: 'NFTS_HEADER',
      nftSort,
      uid: `nft-headers-${nftSort}`,
    },
    { type: 'NFTS_HEADER_SPACE_AFTER', uid: 'nfts-header-space-after' },
  ];
  if (uniqueTokensInShowcaseIds.length > 0 && listType !== 'select-nft') {
    result.push({
      // @ts-expect-error "name" does not exist in type.
      name: i18n.t(i18n.l.account.tab_showcase),
      total: uniqueTokensInShowcaseIds.length,
      type: 'FAMILY_HEADER',
      uid: 'showcase',
    });
    for (let index = 0; index < uniqueTokensInShowcaseIds.length; index++) {
      const uniqueId = uniqueTokensInShowcaseIds[index];
      result.push({
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        index,
        type: 'NFT',
        uid: `showcase-${uniqueId}`,
        uniqueId,
      });
    }

    result.push({ type: 'NFT_SPACE_AFTER', uid: `showcase-space-after` });
  }
  // i18n all names
  if (sellingTokens.length > 0) {
    result.push({
      // @ts-expect-error "name" does not exist in type.
      name: i18n.t(i18n.l.nfts.selling),
      total: sellingTokens.length,
      type: 'FAMILY_HEADER',
      uid: 'selling',
    });
    for (let index = 0; index < sellingTokens.length; index++) {
      const uniqueId = sellingTokens[index].uniqueId;
      result.push({
        // @ts-expect-error "index" does not exist in type.
        index,
        type: 'NFT',
        uid: `selling-${uniqueId}`,
        uniqueId,
      });
    }
    result.push({ type: 'NFT_SPACE_AFTER', uid: `showcase-space-after` });
  }
  for (const family of families2) {
    result.push({
      // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
      image: assetsByName[family][0].familyImage,
      name: family,
      total: assetsByName[family].length,
      type: 'FAMILY_HEADER',
      uid: family,
    });
    const tokens = assetsByName[family].map(({ uniqueId }) => uniqueId);
    for (let index = 0; index < tokens.length; index++) {
      const uniqueId = tokens[index];

      // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
      result.push({ index, type: 'NFT', uid: uniqueId, uniqueId });
    }

    result.push({ type: 'NFT_SPACE_AFTER', uid: `${family}-space-after` });
  }
  if (hiddenUniqueTokensIds.length > 0 && listType === 'wallet' && !isReadOnlyWallet) {
    result.push({
      // @ts-expect-error "name" does not exist in type.
      name: lang.t('button.hidden'),
      total: hiddenUniqueTokensIds.length,
      type: 'FAMILY_HEADER',
      uid: 'hidden',
    });
    for (let index = 0; index < hiddenUniqueTokensIds.length; index++) {
      const uniqueId = hiddenUniqueTokensIds[index];
      result.push({
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        index,
        type: 'NFT',
        uid: `hidden-${uniqueId}`,
        uniqueId,
      });
    }

    result.push({ type: 'NFT_SPACE_AFTER', uid: `showcase-space-after` });
  }
  return result;
};

export const buildUniqueTokenName = ({ collection, id, name, uniqueId }: any) => {
  if (name) return name;
  if (id) return `${collection?.name} #${id}`;
  return uniqueId;
};
