import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { type CollectionNfts, type NftsState } from '@/state/nfts/types';

/**
 * Counts visible page members plus any holdings the summary reports beyond the page.
 * Expanded collections render those visible members in page order.
 */
export function appendNftCollectionRows(
  rows: CellTypes[],
  collections: NftsState['collections'],
  openCollections: NftsState['openCollections'],
  collectionNfts: ReadonlyMap<string, CollectionNfts>,
  exclusions?: ReadonlyMap<string, ReadonlySet<string>>
): void {
  for (const [collectionId, collection] of collections) {
    const nfts = collectionNfts.get(collectionId);
    const excluded = exclusions?.get(collectionId);

    const pageSize = nfts?.size ?? 0;
    let visibleOnPage = pageSize;
    if (nfts && excluded) {
      for (const id of excluded) if (nfts.has(id)) visibleOnPage -= 1;
    }
    const beyondPage = Math.max(0, Number(collection.totalCount) - pageSize);
    const total = visibleOnPage + beyondPage;
    if (!total) continue;

    const isOpen = openCollections.has(collectionId);
    rows.push({
      type: CellType.FAMILY_HEADER,
      uid: collectionId,
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
          rows.push({ type: CellType.NFT, uid: uniqueId, asset, index });
          index += 1;
        }
      } else if (!excluded) {
        for (let index = 0; index < total; index++) {
          rows.push({ type: CellType.NFT, uid: `placeholder:${collectionId}:${index}`, asset: null, index });
        }
      }
    }

    rows.push({ type: CellType.NFT_SPACE_AFTER, uid: `${collectionId}-space-after` });
  }
}
