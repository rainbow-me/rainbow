import lang from 'i18n-js';
import { chunk, compact, groupBy, isEmpty, slice, sortBy } from 'lodash';
import { add, convertAmountToNativeDisplay, greaterThan } from './utilities';
import { AssetListType } from '@/components/asset-list/RecyclerAssetList2';
import store from '@/redux/store';
import {
  ETH_ADDRESS,
  ETH_ICON_URL,
  supportedNativeCurrencies,
} from '@/references';
import {
  ethereumUtils,
  getUniqueTokenFormat,
  getUniqueTokenType,
} from '@/utils';

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

export const buildCoinsList = (
  sortedAssets: any,
  nativeCurrency: any,
  isCoinListEdited: any,
  pinnedCoins: any,
  hiddenCoins: any
) => {
  if (!sortedAssets.length) {
    return {
      assets: [],
      smallBalancesValue: 0,
      totalBalancesValue: 0,
    };
  }

  let standardAssets: any = [],
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
export const buildBriefCoinsList = (
  sortedAssets: any,
  nativeCurrency: any,
  isCoinListEdited: any,
  pinnedCoins: any,
  hiddenCoins: any
) => {
  const { assets, smallBalancesValue, totalBalancesValue } = buildCoinsList(
    sortedAssets,
    nativeCurrency,
    isCoinListEdited,
    pinnedCoins,
    hiddenCoins
  );
  const briefAssets = [];
  if (assets) {
    for (let asset of assets) {
      if (asset.coinDivider) {
        briefAssets.push({
          defaultToEditButton: asset.defaultToEditButton,
          type: 'COIN_DIVIDER',
          uid: 'coin-divider',
          value: smallBalancesValue,
        });
      } else if (asset.smallBalancesContainer) {
        for (let smallAsset of asset.assets) {
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

export const buildUniqueTokenList = (
  uniqueTokens: any,
  selectedShowcaseTokens: any[] = []
) => {
  let rows: any = [];
  const showcaseTokens = [];
  const bundledShowcaseTokens = [];

  const grouped = groupBy(uniqueTokens, token => token.familyName);
  const families = Object.keys(grouped);

  for (let family of families) {
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
      const id = tokensRow[0]
        .map(({ uniqueId }: any) => uniqueId)
        .join(`__${index}`);
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

  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'row' implicitly has an 'any' type.
  rows.forEach((row, i) => {
    row.familyId = i;
    row.tokens[0][0].rowNumber = i;
  });
  return rows;
};

const regex = RegExp(/\s*(the)\s/, 'i');

export const buildBriefUniqueTokenList = (
  uniqueTokens: any,
  selectedShowcaseTokens: any,
  sellingTokens: any[] = [],
  hiddenTokens: string[] = [],
  listType: AssetListType = 'wallet',
  isReadOnlyWallet = false
) => {
  const hiddenUniqueTokensIds = uniqueTokens
    .filter(({ fullUniqueId }: any) => hiddenTokens.includes(fullUniqueId))
    .map(({ uniqueId }: any) => uniqueId);
  const nonHiddenUniqueTokens = uniqueTokens.filter(
    ({ fullUniqueId }: any) => !hiddenTokens.includes(fullUniqueId)
  );
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
  const grouped2 = groupBy(filteredUniqueTokens, token => token.familyName);
  const families2 = sortBy(Object.keys(grouped2), row =>
    row.replace(regex, '').toLowerCase()
  );
  const result = [
    { type: 'NFTS_HEADER', uid: 'nfts-header' },
    { type: 'NFTS_HEADER_SPACE_AFTER', uid: 'nfts-header-space-after' },
  ];
  if (uniqueTokensInShowcaseIds.length > 0 && listType !== 'select-nft') {
    result.push({
      // @ts-expect-error "name" does not exist in type.
      name: 'Showcase',
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
  if (sellingTokens.length > 0) {
    result.push({
      // @ts-expect-error "name" does not exist in type.
      name: 'Selling',
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
  for (let family of families2) {
    result.push({
      // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
      image: grouped2[family][0].familyImage,
      name: family,
      total: grouped2[family].length,
      type: 'FAMILY_HEADER',
      uid: family,
    });
    const tokens = grouped2[family].map(({ uniqueId }) => uniqueId);
    for (let index = 0; index < tokens.length; index++) {
      const uniqueId = tokens[index];

      // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
      result.push({ index, type: 'NFT', uid: uniqueId, uniqueId });
    }

    result.push({ type: 'NFT_SPACE_AFTER', uid: `${family}-space-after` });
  }
  if (
    hiddenUniqueTokensIds.length > 0 &&
    listType === 'wallet' &&
    !isReadOnlyWallet
  ) {
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

export const buildUniqueTokenName = ({
  collection,
  id,
  name,
  uniqueId,
}: any) => {
  if (name) return name;
  if (id) return `${collection?.name} #${id}`;
  return uniqueId;
};
