import { UniqueAsset } from '@/entities';

export const uniqueTokenTypes = {
  ENS: 'ENS',
  NFT: 'NFT',
  POAP: 'POAP',
} as const;
export type UniqueTokenType = keyof typeof uniqueTokenTypes;

export const uniqueTokenFormats = {
  '3d': '3d',
  'audio': 'audio',
  'image': 'image',
  'video': 'video',
} as const;
export type UniqueTokenFormat = keyof typeof uniqueTokenFormats;

export function getUniqueTokenType(asset: UniqueAsset) {
  const { familyName, uniqueId } = asset;
  if (asset.isPoap) return uniqueTokenTypes.POAP;
  if (familyName === 'ENS' && uniqueId !== 'Unknown ENS name') {
    return uniqueTokenTypes.ENS;
  }
  return uniqueTokenTypes.NFT;
}

export function getUniqueTokenFormat(asset: UniqueAsset) {
  if (asset?.model_properties) {
    return uniqueTokenFormats['3d'];
  }
  if (asset?.audio_properties) {
    return uniqueTokenFormats.audio;
  }
  if (asset?.video_properties) {
    return uniqueTokenFormats.video;
  }
  return uniqueTokenFormats.image;
}
