import { groupBy } from 'lodash';

import { CellType, type NftCell } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { parseUniqueId } from '@/features/nfts/core/uniqueId';
import * as i18n from '@/languages';
import { type OpenCollectionsState } from '@/state/nfts/types';

/**
 * Builds an ENS profile's visible collections and the NFT rows for open families.
 */
export function buildProfileNftRows(
  assets: UniqueAsset[],
  showcase: string[],
  hidden: string[],
  openCollections: OpenCollectionsState['openCollections']
): NftCell[] {
  const hiddenIds = new Set(hidden);
  const showcaseIds = new Set(showcase);
  const showcased: UniqueAsset[] = [];
  const visible: UniqueAsset[] = [];

  for (const asset of assets) {
    const id = asset.uniqueId.toLowerCase();
    if (hiddenIds.has(id)) continue;

    visible.push(asset);

    const { network, contractAddress, tokenId } = parseUniqueId(id);
    if (showcaseIds.has(`${contractAddress}_${tokenId}`) || (network && showcaseIds.has(`${network}_${contractAddress}_${tokenId}`))) {
      showcased.push(asset);
    }
  }

  const rows: NftCell[] = [];

  if (showcased.length) {
    const name = i18n.t(i18n.l.account.tab_showcase);
    const collectionKey = name.toLowerCase();
    const isOpen = openCollections[collectionKey] ?? false;
    rows.push({ type: CellType.FAMILY_HEADER, uid: 'showcase', collectionKey, isOpen, name, total: showcased.length });

    if (isOpen) {
      for (let index = 0; index < showcased.length; index++) {
        const asset = showcased[index];
        rows.push({ type: CellType.NFT, uid: `showcase-${asset.uniqueId.toLowerCase()}`, asset, index });
      }

      rows.push({ type: CellType.NFT_SPACE_AFTER, uid: 'showcase-space-after' });
    }
  }

  const families = groupBy(visible, asset => asset.collectionName);
  for (const name in families) {
    const tokens = families[name];
    const images = tokens[0].images;
    const collectionKey = name.toLowerCase();
    const isOpen = openCollections[collectionKey] ?? false;

    rows.push({
      type: CellType.FAMILY_HEADER,
      collectionKey,
      isOpen,
      uid: name,
      name,
      image: images.lowResUrl ?? images.highResUrl ?? undefined,
      total: tokens.length,
    });

    if (!isOpen) continue;

    for (let index = 0; index < tokens.length; index++) {
      const asset = tokens[index];
      rows.push({ type: CellType.NFT, uid: asset.uniqueId, asset, index });
    }

    rows.push({ type: CellType.NFT_SPACE_AFTER, uid: `${name}-space-after` });
  }

  return rows;
}
