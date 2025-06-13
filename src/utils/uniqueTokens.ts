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
