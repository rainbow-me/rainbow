import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { areTokenIdsNetworkQualified, collectionIdFromUniqueId } from '@/features/nfts/core/uniqueId';
import { appendNftCollectionRows } from '@/features/nfts/data/appendNftCollectionRows';
import * as i18n from '@/languages';
import { type CollectionNfts, type NftsState } from '@/state/nfts/types';

// ============ Types ========================================================== //

/** Network-qualified saved token IDs and their collection exclusions. */
export type NftPreferences = {
  showcase: string[];
  hidden: string[];
  exclusions: ReadonlyMap<string, ReadonlySet<string>>;
};

// ============ Constants ====================================================== //

const EMPTY_TOKENS: string[] = [];
const NFT_HEADER: CellTypes = { type: CellType.NFTS_HEADER, uid: 'nft-headers' };
const NFT_HEADER_SPACE: CellTypes = { type: CellType.SPACER, uid: 'nfts-header-space-after', height: 12 };
const NFT_EMPTY: CellTypes = { type: CellType.NFTS_EMPTY, uid: 'nft-empty' };
const NFT_LOADING: CellTypes = { type: CellType.NFTS_LOADING, uid: 'nft-loading' };
const SHOWCASE_SPACE_AFTER: CellTypes = { type: CellType.NFT_SPACE_AFTER, uid: 'showcase-space-after' };
const HIDDEN_SPACE_AFTER: CellTypes = { type: CellType.NFT_SPACE_AFTER, uid: 'hidden-space-after' };

// ============ Preference Data ================================================ //

/**
 * Keeps qualified saved IDs for their own sections. Exclusions apply once both lists are qualified.
 */
export function buildNftPreferences(showcase: string[], hidden: string[]): NftPreferences {
  const showcaseQualified = areTokenIdsNetworkQualified(showcase);
  const hiddenQualified = areTokenIdsNetworkQualified(hidden);
  const exclusions = new Map<string, Set<string>>();

  if (showcaseQualified && hiddenQualified) {
    for (const tokens of [showcase, hidden]) {
      for (const uniqueId of tokens) {
        const collectionId = collectionIdFromUniqueId(uniqueId);
        let excluded = exclusions.get(collectionId);
        if (!excluded) {
          excluded = new Set();
          exclusions.set(collectionId, excluded);
        }
        excluded.add(uniqueId.toLowerCase());
      }
    }
  }

  return {
    showcase: showcaseQualified ? showcase : EMPTY_TOKENS,
    hidden: hiddenQualified ? hidden : EMPTY_TOKENS,
    exclusions,
  };
}

// ============ Row Construction =============================================== //

/**
 * Builds wallet NFT rows, including showcase, hidden and loading sections.
 */
export function buildNftRows({
  collections,
  collectionNfts,
  metadata,
  preferences,
  openCollections,
  loading,
  hasMore,
  readOnly,
}: {
  collections: NftsState['collections'];
  collectionNfts: ReadonlyMap<string, CollectionNfts>;
  metadata: ReadonlyMap<string, UniqueAsset>;
  preferences: NftPreferences;
  openCollections: NftsState['openCollections'];
  loading: boolean;
  hasMore: boolean;
  readOnly: boolean;
}): CellTypes[] {
  const rows: CellTypes[] = [NFT_HEADER, NFT_HEADER_SPACE];
  if (!collections.size) {
    rows.push(loading ? NFT_LOADING : NFT_EMPTY);
    return rows;
  }

  appendPreferenceRows(rows, 'showcase', preferences.showcase, openCollections.has('showcase'), metadata, collectionNfts);
  appendNftCollectionRows(rows, collections, openCollections, collectionNfts, preferences.exclusions);
  if (!readOnly && !hasMore) {
    appendPreferenceRows(rows, 'hidden', preferences.hidden, openCollections.has('hidden'), metadata, collectionNfts);
  }
  return rows;
}

function appendPreferenceRows(
  rows: CellTypes[],
  id: 'showcase' | 'hidden',
  tokens: string[],
  open: boolean,
  metadata: ReadonlyMap<string, UniqueAsset>,
  collectionNfts: ReadonlyMap<string, CollectionNfts>
): void {
  if (!tokens.length) return;

  const name = id === 'showcase' ? i18n.t(i18n.l.account.tab_showcase) : i18n.t(i18n.l.button.hidden);
  rows.push({ type: CellType.FAMILY_HEADER, uid: id, isOpen: open, name, total: tokens.length });

  if (open) {
    for (let index = 0; index < tokens.length; index++) {
      const uniqueId = tokens[index];
      const asset = collectionNfts.get(collectionIdFromUniqueId(uniqueId))?.get(uniqueId) ?? metadata.get(uniqueId) ?? null;
      rows.push({ type: CellType.NFT, uid: `${id}-${uniqueId}`, asset, index });
    }
  }

  rows.push(id === 'showcase' ? SHOWCASE_SPACE_AFTER : HIDDEN_SPACE_AFTER);
}
