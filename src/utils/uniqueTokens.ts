import isSupportedUriExtension from '@/helpers/isSupportedUriExtension';
import supportedUriExtensions from '@/helpers/supportedUriExtensions';
import { NFT } from '@/resources/nfts/types';

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

export function getUniqueTokenFormat(asset: NFT) {
  const {
    videoUrl,
    images: { fullResUrl },
  } = asset;
  const assetUrl = videoUrl || fullResUrl || '';
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
