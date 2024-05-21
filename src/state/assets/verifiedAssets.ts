import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export interface VerifiedAssetsState {
  verifiedAssets: ParsedSearchAsset[];
}

export const verifiedAssetsStore = createRainbowStore<VerifiedAssetsState>(
  () => ({
    verifiedAssets: [],
  }),
  {
    storageKey: 'verifiedAssets',
    version: 1,
  }
);
