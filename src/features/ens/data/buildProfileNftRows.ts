import { nullObject } from '@storesjs/stores';

import { CellType, type NftCell } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { abbreviateAddress } from '@/features/address/core/formatAddress';
import { collectionIdFromUniqueId } from '@/features/nfts/core/uniqueId';
import * as i18n from '@/languages';

/**
 * Groups visible NFTs by their Arc collection ID. Showcase also accepts
 * saved IDs from before the network prefix was added.
 */
export function buildProfileNftRows(
  assets: UniqueAsset[],
  showcase: string[],
  hidden: string[],
  openCollections: ReadonlySet<string>
): NftCell[] {
  const hiddenIds = new Set(hidden);
  const showcaseIds = new Set(showcase);
  const showcased: UniqueAsset[] = [];
  const collections: Record<string, UniqueAsset[]> = nullObject();

  for (const asset of assets) {
    const id = asset.uniqueId;
    if (hiddenIds.has(id)) continue;

    const collectionId = collectionIdFromUniqueId(id);
    (collections[collectionId] ??= []).push(asset);

    if (showcaseIds.size) {
      const legacyId = id.slice(id.indexOf('_') + 1);
      if (showcaseIds.has(id) || showcaseIds.has(legacyId)) showcased.push(asset);
    }
  }

  const rows: NftCell[] = [];
  if (showcased.length) {
    appendProfileCollection(rows, 'showcase', i18n.t(i18n.l.account.tab_showcase), showcased, openCollections);
  }

  for (const id in collections) {
    const members = collections[id];
    const first = members[0];
    const name = first.collectionName || abbreviateAddress(first.contractAddress);
    const image = first.images.lowResUrl ?? first.images.highResUrl ?? undefined;
    appendProfileCollection(rows, id, name, members, openCollections, image);
  }
  return rows;
}

function appendProfileCollection(
  rows: NftCell[],
  id: string,
  name: string,
  assets: UniqueAsset[],
  openCollections: ReadonlySet<string>,
  image?: string
): void {
  const isOpen = openCollections.has(id);
  rows.push({ type: CellType.FAMILY_HEADER, uid: id, name, image, isOpen, total: assets.length });
  if (!isOpen) return;

  for (let index = 0; index < assets.length; index++) {
    const asset = assets[index];
    const uid = id === 'showcase' ? `showcase-${asset.uniqueId}` : asset.uniqueId;
    rows.push({ type: CellType.NFT, uid, asset, index });
  }
  rows.push({ type: CellType.NFT_SPACE_AFTER, uid: `${id}-space-after` });
}
