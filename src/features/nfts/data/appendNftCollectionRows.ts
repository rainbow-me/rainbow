import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { type NftsState, type OpenCollectionsState } from '@/state/nfts/types';

import { type CollectionNfts } from './collectionNftsStore';

/**
 * Appends collection headers and prepared NFT rows for open collections.
 */
export function appendNftCollectionRows(
  rows: CellTypes[],
  collections: NftsState['collections'],
  openCollections: OpenCollectionsState['openCollections'],
  collectionNfts: ReadonlyMap<string, CollectionNfts>,
  exclusions?: ReadonlyMap<string, ReadonlySet<string>>
): void {
  for (const [collectionKey, collection] of collections) {
    const nfts = collectionNfts.get(collectionKey);
    const excluded = exclusions?.get(collectionKey);
    const isOpen = openCollections[collectionKey] ?? false;
    let total = nfts?.size ?? Number(collection.totalCount);
    if (nfts && excluded) {
      for (const id of excluded) if (nfts.has(id)) total -= 1;
    }
    if (!total) continue;

    rows.push({
      type: CellType.FAMILY_HEADER,
      uid: collection.id,
      collectionKey,
      isOpen,
      name: collection.name,
      image: collection.imageUrl || undefined,
      total,
    });

    if (isOpen) {
      if (nfts) {
        let index = 0;
        for (const [uniqueId, asset] of nfts) {
          if (excluded?.has(uniqueId)) continue;
          const uid = excluded ? uniqueId : `${collection.id}_${index}`;
          rows.push({ type: CellType.NFT, uid, asset, index });
          index += 1;
        }
      } else if (!excluded) {
        for (let index = 0; index < total; index++) {
          rows.push({ type: CellType.NFT, uid: `${collection.id}_${index}`, asset: null, index });
        }
      }
    }

    rows.push({ type: CellType.NFT_SPACE_AFTER, uid: `${collection.id}-space-after` });
  }
}
