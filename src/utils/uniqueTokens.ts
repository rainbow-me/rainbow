import { UniqueAsset } from '@rainbow-me/entities';

export const UNIQUE_TOKEN_TYPES = {
  ENS: 'ENS',
  NFT: 'NFT',
  POAP: 'POAP',
} as const;

export function getUniqueTokenType(asset: UniqueAsset) {
  const { familyName, uniqueId } = asset;
  if (asset.isPoap) return UNIQUE_TOKEN_TYPES.POAP;
  if (familyName === 'ENS' && uniqueId !== 'Unknown ENS name') {
    return UNIQUE_TOKEN_TYPES.ENS;
  }
  return UNIQUE_TOKEN_TYPES.NFT;
}
