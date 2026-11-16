import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { isDataComplete, parseUniqueId } from '@/features/nfts/core/uniqueId';
import { appendNftCollectionRows } from '@/features/nfts/data/appendNftCollectionRows';
import { type CollectionNfts } from '@/features/nfts/data/collectionNftsStore';
import * as i18n from '@/languages';
import { type NftsState, type OpenCollectionsState } from '@/state/nfts/types';

// ============ Types ========================================================== //

/** Migrated preferences and the owned NFTs excluded from ordinary collections. */
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
 * Keeps each migrated preference list; collection exclusions require both lists to be migrated.
 */
export function buildNftPreferences(showcase: string[], hidden: string[]): NftPreferences {
  const showcaseReady = isDataComplete(showcase);
  const hiddenReady = isDataComplete(hidden);
  const exclusions = new Map<string, Set<string>>();

  if (showcaseReady && hiddenReady) {
    for (const tokens of [showcase, hidden]) {
      for (const uniqueId of tokens) {
        const { network, contractAddress } = parseUniqueId(uniqueId);
        const collectionId = `${network}_${contractAddress}`.toLowerCase();
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
    showcase: showcaseReady ? showcase : EMPTY_TOKENS,
    hidden: hiddenReady ? hidden : EMPTY_TOKENS,
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
  openCollections: OpenCollectionsState['openCollections'];
  loading: boolean;
  hasMore: boolean;
  readOnly: boolean;
}): CellTypes[] {
  const rows: CellTypes[] = [NFT_HEADER, NFT_HEADER_SPACE];
  if (!collections.size) {
    rows.push(loading ? NFT_LOADING : NFT_EMPTY);
    return rows;
  }

  appendPreferenceRows(rows, 'showcase', preferences.showcase, openCollections.showcase, metadata, collectionNfts);
  appendNftCollectionRows(rows, collections, openCollections, collectionNfts, preferences.exclusions);
  if (!readOnly && !hasMore) {
    appendPreferenceRows(rows, 'hidden', preferences.hidden, openCollections.hidden, metadata, collectionNfts);
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
  rows.push({ type: CellType.FAMILY_HEADER, uid: id, collectionKey: id, isOpen: open ?? false, name, total: tokens.length });

  if (open) {
    for (let index = 0; index < tokens.length; index++) {
      const uniqueId = tokens[index];
      const { network, contractAddress } = parseUniqueId(uniqueId);
      const asset = collectionNfts.get(`${network}_${contractAddress}`)?.get(uniqueId) ?? metadata.get(uniqueId) ?? null;
      rows.push({ type: CellType.NFT, uid: `${id}-${uniqueId}`, asset, index });
    }
  }

  rows.push(id === 'showcase' ? SHOWCASE_SPACE_AFTER : HIDDEN_SPACE_AFTER);
}
