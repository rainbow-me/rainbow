import { chunk, compact, groupBy, isEmpty, slice, sortBy } from 'lodash';
import { add, greaterThan } from './utilities';
import { AssetListType } from '@/components/asset-list/RecyclerAssetList2';
import { supportedNativeCurrencies } from '@/references';
import * as i18n from '@/languages';
import { AssetType, NativeCurrencyKey, ParsedAddressAsset, UniqueAsset } from '@/entities';
import { UniqueId } from '@/__swaps__/types/assets';
import { CellType, CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { BooleanMap } from '@/hooks/useCoinListEditOptions';
import { Collection } from '@/state/nfts/types';
import { parseUniqueId } from '@/resources/nfts/utils';
import { NftCollectionSortCriterion } from '@/graphql/__generated__/arc';

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
  hiddenCoins: Set<UniqueId>
) => {
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

export const buildBriefCoinsList = (
  sortedAssets: ParsedAddressAsset[],
  nativeCurrency: NativeCurrencyKey,
  isCoinListEdited: boolean,
  pinnedCoins: BooleanMap,
  hiddenAssets: Set<UniqueId>
) => {
  const { assets, smallBalancesValue, totalBalancesValue } = buildCoinsList(
    sortedAssets,
    nativeCurrency,
    isCoinListEdited,
    pinnedCoins,
    hiddenAssets
  );
  const briefAssets: CellTypes[] = [];
  if (assets) {
    for (const asset of assets) {
      if (asset.coinDivider) {
        briefAssets.push({
          defaultToEditButton: asset.defaultToEditButton,
          type: CellType.COIN_DIVIDER,
          uid: 'coin-divider',
          value: smallBalancesValue,
        });
      } else if (asset.smallBalancesContainer) {
        for (const smallAsset of asset.assets) {
          briefAssets.push({
            type: CellType.COIN,
            uid: 'coin-' + smallAsset.uniqueId,
            uniqueId: smallAsset.uniqueId,
          });
        }
      } else {
        briefAssets.push({
          type: CellType.COIN,
          uid: 'coin-' + asset.uniqueId,
          uniqueId: asset.uniqueId,
        });
      }
    }
  }

  return { briefAssets, totalBalancesValue };
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

export const buildBriefUniqueTokenList = (
  collections: Collection[] | null,
  sellingTokens: UniqueAsset[] | undefined = [],
  showcaseTokens: string[] | undefined = [],
  hiddenTokens: string[] | undefined = [],
  listType: AssetListType = 'wallet',
  isFetchingNfts = false,
  hasMoreCollections = false,
  isShowcaseDataMigrated = false,
  isHiddenDataMigrated = false,
  isReadOnlyWallet = false
) => {
  const result: CellTypes[] = [
    {
      type: CellType.NFTS_HEADER,
      uid: `nft-headers`,
    },
    { type: CellType.NFTS_HEADER_SPACE_AFTER, uid: 'nfts-header-space-after' },
  ];

  if (isShowcaseDataMigrated && showcaseTokens.length > 0 && listType !== 'select-nft') {
    result.push({
      name: i18n.t(i18n.l.account.tab_showcase),
      total: showcaseTokens.length,
      type: CellType.FAMILY_HEADER,
      uid: 'showcase',
    });
    for (let index = 0; index < showcaseTokens.length; index++) {
      const uniqueId = showcaseTokens[index];

      const { network, contractAddress } = parseUniqueId(uniqueId);

      result.push({
        type: CellType.NFT,
        uid: `showcase-${uniqueId}`,
        uniqueId,
        index,
        collectionId: `${network}_${contractAddress}`.toLowerCase(),
      });
    }
    result.push({ type: CellType.NFT_SPACE_AFTER, uid: `showcase-space-after` });
  }

  // i18n all names
  if (sellingTokens.length > 0) {
    result.push({
      name: i18n.t(i18n.l.nfts.selling),
      total: sellingTokens.length,
      type: CellType.FAMILY_HEADER,
      uid: 'selling',
    });
    for (let index = 0; index < sellingTokens.length; index++) {
      const uniqueId = sellingTokens[index].uniqueId;
      result.push({
        index,
        type: CellType.NFT,
        uid: `selling-${uniqueId}`,
        uniqueId,
      });
    }
    result.push({ type: CellType.NFT_SPACE_AFTER, uid: `showcase-space-after` });
  }

  if (!collections?.length) {
    if (!isFetchingNfts) {
      result.push({ type: CellType.NFTS_EMPTY, uid: `nft-empty` });
    } else {
      result.push({ type: CellType.NFTS_LOADING, uid: `nft-loading` });
    }
  } else {
    // Create a Map for O(1) lookups instead of filtering arrays
    const specialTokensByCollection = new Map<string, number>();

    if (isShowcaseDataMigrated && isHiddenDataMigrated) {
      [...showcaseTokens, ...hiddenTokens].forEach(token => {
        const { network, contractAddress } = parseUniqueId(token);
        const collectionId = `${network}_${contractAddress}`.toLowerCase();
        specialTokensByCollection.set(collectionId, (specialTokensByCollection.get(collectionId) || 0) + 1);
      });
    }

    for (const { id, imageUrl, name, totalCount } of collections) {
      let adjustedTotalCount = totalCount;

      if (isShowcaseDataMigrated && isHiddenDataMigrated) {
        const specialCount = specialTokensByCollection.get(id.toLowerCase()) || 0;
        adjustedTotalCount = String(Math.max(0, Number(totalCount) - specialCount));
      }

      if (Number(adjustedTotalCount) === 0) {
        continue;
      }

      result.push({
        image: imageUrl ?? undefined,
        name,
        total: adjustedTotalCount,
        type: CellType.FAMILY_HEADER,
        uid: id,
      });

      for (let index = 0; index < Number(adjustedTotalCount); index++) {
        const uniqueId = `${id}_${index}`;
        result.push({ index, type: CellType.NFT, uid: uniqueId, collectionId: id });
      }

      result.push({ type: CellType.NFT_SPACE_AFTER, uid: `${id}-space-after` });
    }
  }

  if (isHiddenDataMigrated && hiddenTokens.length > 0 && listType === 'wallet' && !isReadOnlyWallet && !hasMoreCollections) {
    result.push({
      name: i18n.t(i18n.l.button.hidden),
      total: hiddenTokens.length,
      type: CellType.FAMILY_HEADER,
      uid: 'hidden',
    });
    for (let index = 0; index < hiddenTokens.length; index++) {
      const uniqueId = hiddenTokens[index];
      const { network, contractAddress } = parseUniqueId(uniqueId);

      result.push({
        index,
        type: CellType.NFT,
        uid: `hidden-${uniqueId}`,
        uniqueId,
        collectionId: `${network}_${contractAddress}`,
      });
    }
    result.push({ type: CellType.NFT_SPACE_AFTER, uid: `hidden-space-after` });
  }

  return result;
};

export const legacyBuildBriefUniqueTokenList = (
  uniqueTokens: UniqueAsset[],
  showcaseTokens: string[] | undefined = [],
  sellingTokens: UniqueAsset[] | undefined = [],
  hiddenTokens: string[] | undefined = [],
  listType: AssetListType = 'wallet',
  isReadOnlyWallet = false,
  nftSort = NftCollectionSortCriterion.MostRecent,
  isFetchingNfts = false
) => {
  const hiddenUniqueTokensIds: string[] = [];
  const uniqueTokensInShowcaseIds: string[] = [];
  const filteredUniqueTokens: UniqueAsset[] = [];

  for (const token of uniqueTokens) {
    if (hiddenTokens.includes(token.uniqueId.toLowerCase())) {
      hiddenUniqueTokensIds.push(token.uniqueId.toLowerCase());
      continue;
    }

    const { network, contractAddress, tokenId } = parseUniqueId(token.uniqueId);

    if (
      showcaseTokens.includes(`${contractAddress}_${tokenId}`.toLowerCase()) ||
      (network && showcaseTokens.includes(`${network}_${contractAddress}_${tokenId}`.toLowerCase()))
    ) {
      uniqueTokensInShowcaseIds.push(token.uniqueId.toLowerCase());
    }

    if (listType === 'select-nft') {
      const notAnimated = !token.images.animatedUrl;
      if (notAnimated && token.type === AssetType.nft) {
        filteredUniqueTokens.push(token);
      }
    } else {
      filteredUniqueTokens.push(token);
    }
  }

  const assetsByName = groupBy<UniqueAsset>(filteredUniqueTokens, token => token.collectionName);

  const result: CellTypes[] = [
    {
      type: CellType.NFTS_HEADER,
      nftSort,
      uid: `nft-headers-${nftSort}`,
    },
    { type: CellType.NFTS_HEADER_SPACE_AFTER, uid: 'nfts-header-space-after' },
  ];
  if (uniqueTokensInShowcaseIds.length > 0 && listType !== 'select-nft') {
    result.push({
      name: i18n.t(i18n.l.account.tab_showcase),
      total: uniqueTokensInShowcaseIds.length,
      type: CellType.LEGACY_FAMILY_HEADER,
      uid: 'showcase',
    });
    for (let index = 0; index < uniqueTokensInShowcaseIds.length; index++) {
      const uniqueId = uniqueTokensInShowcaseIds[index];
      result.push({
        index,
        type: CellType.LEGACY_NFT,
        uid: `showcase-${uniqueId}`,
        uniqueId,
      });
    }

    result.push({ type: CellType.NFT_SPACE_AFTER, uid: `showcase-space-after` });
  }

  // i18n all names
  if (sellingTokens.length > 0) {
    result.push({
      name: i18n.t(i18n.l.nfts.selling),
      total: sellingTokens.length,
      type: CellType.LEGACY_FAMILY_HEADER,
      uid: 'selling',
    });
    for (let index = 0; index < sellingTokens.length; index++) {
      const uniqueId = sellingTokens[index].uniqueId;
      result.push({
        index,
        type: CellType.LEGACY_NFT,
        uid: `selling-${uniqueId}`,
        uniqueId,
      });
    }
    result.push({ type: CellType.NFT_SPACE_AFTER, uid: `showcase-space-after` });
  }

  if (!Object.keys(assetsByName).length) {
    if (!isFetchingNfts) {
      result.push({ type: CellType.NFTS_EMPTY, uid: `nft-empty` });
    } else {
      result.push({ type: CellType.NFTS_LOADING, uid: `nft-loading-${nftSort}` });
    }
  } else {
    for (const family of Object.keys(assetsByName)) {
      result.push({
        image: assetsByName[family][0].images.lowResUrl ?? assetsByName[family][0].images.highResUrl ?? undefined,
        name: family,
        total: assetsByName[family].length,
        type: CellType.LEGACY_FAMILY_HEADER,
        uid: family,
      });
      const tokens = assetsByName[family].map(({ uniqueId }) => uniqueId);
      for (let index = 0; index < tokens.length; index++) {
        const uniqueId = tokens[index];
        result.push({ index, type: CellType.LEGACY_NFT, uid: uniqueId, uniqueId });
      }

      result.push({ type: CellType.NFT_SPACE_AFTER, uid: `${family}-space-after` });
    }
  }

  if (hiddenUniqueTokensIds?.length > 0 && listType === 'wallet' && !isReadOnlyWallet) {
    result.push({
      name: i18n.t(i18n.l.button.hidden),
      total: hiddenUniqueTokensIds.length,
      type: CellType.LEGACY_FAMILY_HEADER,
      uid: 'hidden',
    });
    for (let index = 0; index < hiddenUniqueTokensIds.length; index++) {
      const uniqueId = hiddenUniqueTokensIds[index];
      result.push({
        index,
        type: CellType.LEGACY_NFT,
        uid: `hidden-${uniqueId}`,
        uniqueId,
      });
    }

    result.push({ type: CellType.NFT_SPACE_AFTER, uid: `showcase-space-after` });
  }

  return result;
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
