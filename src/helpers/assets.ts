import { chunk, compact, groupBy, isEmpty, slice, sortBy } from 'lodash';

import { type ParsedSearchAsset, type UniqueId } from '@/__swaps__/types/assets';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import { supportedCurrencies as supportedNativeCurrencies } from '@/features/currency/supportedCurrencies';
import type { NativeCurrencyKey } from '@/features/currency/types';
import { parseUniqueId } from '@/features/nfts/core/uniqueId';
import * as i18n from '@/languages';
import { parsedSearchAssetToParsedAddressAsset } from '@/state/assets/utils';

import { add, greaterThan } from './utilities';

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
  sortedAssets: Map<UniqueId, ParsedSearchAsset>,
  nativeCurrency: NativeCurrencyKey,
  isCoinListEdited: boolean,
  pinnedCoins: Record<string, boolean>,
  hiddenCoins: Set<UniqueId>
) => {
  if (!sortedAssets.size) {
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
  sortedAssets.forEach(parsedAsset => {
    const asset = parsedSearchAssetToParsedAddressAsset(parsedAsset);
    if (hiddenCoins.has(asset.uniqueId)) {
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
    } else if (greaterThan(parsedAsset.native.balance.amount, supportedNativeCurrencies[nativeCurrency].smallThreshold)) {
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

export const buildUniqueTokenList = (uniqueTokens: UniqueAsset[], selectedShowcaseTokens: string[] = []) => {
  let rows: {
    childrenAmount: number;
    familyImage?: string;
    familyName: string;
    isHeader: boolean;
    stableId: string;
    tokens: UniqueAsset[][];
    uniqueId: string;
    familyId?: number;
    rowNumber?: number;
  }[] = [];
  const showcaseTokens = [];
  const bundledShowcaseTokens = [];

  const grouped = groupBy(uniqueTokens, token => token.collectionName);
  const families = Object.keys(grouped);

  for (const family of families) {
    const tokensRow: UniqueAsset[][] = [];
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
    const tokenChunks = chunk(compact(tokensRow), 50);
    tokenChunks.forEach((tokenChunk, index) => {
      const id = tokensRow[0].map(({ uniqueId }) => uniqueId).join(`__${index}`);
      rows.push({
        childrenAmount: grouped[family].length,
        familyImage: tokensRow?.[0]?.[0]?.images.lowResUrl ?? tokensRow?.[0]?.[0]?.images.highResUrl ?? undefined,
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

  rows.forEach((row, i) => {
    row.familyId = i;
  });
  return rows;
};

export const buildUniqueTokenName = ({
  collectionName,
  tokenId,
  name,
  uniqueId,
}: {
  collectionName: string;
  tokenId: string;
  name: string;
  uniqueId: string;
}) => {
  if (name) return name;
  if (collectionName) return `${collectionName} #${tokenId}`;
  const { contractAddress, tokenId: uniqueTokenId } = parseUniqueId(uniqueId);
  return `${contractAddress}_${uniqueTokenId}`;
};
