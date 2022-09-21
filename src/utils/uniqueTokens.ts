import { UniqueAsset } from '@/entities';
import isSupportedUriExtension from '@/helpers/isSupportedUriExtension';
import supportedUriExtensions from '@/helpers/supportedUriExtensions';

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
  const { animation_url, image_url } = asset;
  const assetUrl = animation_url || image_url || '';
  if (
    isSupportedUriExtension(
      assetUrl,
      supportedUriExtensions.SUPPORTED_3D_EXTENSIONS
    )
  ) {
    return uniqueTokenFormats['3d'];
  }
  if (
    isSupportedUriExtension(
      assetUrl,
      supportedUriExtensions.SUPPORTED_AUDIO_EXTENSIONS
    )
  ) {
    return uniqueTokenFormats.audio;
  }
  if (
    isSupportedUriExtension(
      assetUrl,
      supportedUriExtensions.SUPPORTED_VIDEO_EXTENSIONS
    )
  ) {
    return uniqueTokenFormats.video;
  }
  return uniqueTokenFormats.image;
}
