import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { isDataComplete, parseUniqueId } from '@/features/nfts/core/uniqueId';
import * as i18n from '@/languages';
import { type NftsState } from '@/state/nfts/types';

export function buildNftRows({
  collections,
  showcase,
  hidden,
  openCollections,
  loading,
  hasMore,
  readOnly,
  selecting = false,
}: Pick<NftsState, 'collections'> & {
  showcase: string[];
  hidden: string[];
  openCollections: Record<string, boolean>;
  loading: boolean;
  hasMore: boolean;
  readOnly: boolean;
  selecting?: boolean;
}): CellTypes[] {
  const rows: CellTypes[] = selecting
    ? []
    : [
        { type: CellType.NFTS_HEADER, uid: 'nft-headers' },
        { type: CellType.SPACER, uid: 'nfts-header-space-after', height: 12 },
      ];
  if (!collections.size) {
    if (!selecting)
      rows.push(loading ? { type: CellType.NFTS_LOADING, uid: 'nft-loading' } : { type: CellType.NFTS_EMPTY, uid: 'nft-empty' });
    return rows;
  }

  const preferencesReady = isDataComplete(showcase) && isDataComplete(hidden);
  const excluded = new Map<string, Set<string>>();
  if (!selecting && preferencesReady) {
    for (const uniqueId of [...showcase, ...hidden]) {
      const { network, contractAddress } = parseUniqueId(uniqueId);
      const collectionId = `${network}_${contractAddress}`.toLowerCase();
      let tokens = excluded.get(collectionId);
      if (!tokens) excluded.set(collectionId, (tokens = new Set()));
      tokens.add(uniqueId.toLowerCase());
    }
  }

  if (!selecting && isDataComplete(showcase)) appendPreferenceRows('showcase', i18n.t(i18n.l.account.tab_showcase), showcase);

  for (const collection of collections.values()) {
    const id = collection.id;
    const idLower = id.toLowerCase();
    const exclusions = excluded.get(idLower);
    const ownedIds = collection.nfts?.ids;
    const visibleIds = exclusions ? ownedIds?.filter(uniqueId => !exclusions.has(uniqueId)) : undefined;
    const total = visibleIds?.length ?? ownedIds?.length ?? Number(collection.totalCount);
    if (!total) continue;

    rows.push({
      type: CellType.FAMILY_HEADER,
      uid: collection.id,
      name: collection.name,
      image: collection.imageUrl || undefined,
      total,
    });
    if (openCollections[idLower] && (!exclusions || ownedIds)) {
      for (let index = 0; index < total; index++) {
        const uniqueId = visibleIds?.[index];
        rows.push({ type: CellType.NFT, uid: uniqueId ?? `${id}_${index}`, collectionId: id, index, uniqueId });
      }
    }
    rows.push({ type: CellType.NFT_SPACE_AFTER, uid: `${id}-space-after` });
  }

  if (!selecting && !readOnly && !hasMore && isDataComplete(hidden)) appendPreferenceRows('hidden', i18n.t(i18n.l.button.hidden), hidden);
  return rows;

  function appendPreferenceRows(id: string, name: string, ids: string[]): void {
    if (!ids.length) return;
    rows.push({ type: CellType.FAMILY_HEADER, uid: id, name, total: ids.length });
    if (openCollections[id])
      for (let index = 0; index < ids.length; index++) {
        const uniqueId = ids[index];
        const { network, contractAddress } = parseUniqueId(uniqueId);
        rows.push({
          type: CellType.NFT,
          uid: `${id}-${uniqueId}`,
          collectionId: id === 'showcase' ? `${network}_${contractAddress}`.toLowerCase() : `${network}_${contractAddress}`,
          index,
          uniqueId,
        });
      }
    rows.push({ type: CellType.NFT_SPACE_AFTER, uid: `${id}-space-after` });
  }
}
