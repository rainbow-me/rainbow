import { CLOUDINARY_CLOUD_NAME } from 'react-native-dotenv';
import { CLOUDINARY_TOKEN_LAUNCHER_PRESET, CLOUDINARY_TOKEN_LAUNCHER_PRESET_GIFS } from '../constants';

const imageMimeTypes: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  heic: 'image/heic',
  heif: 'image/heif',
};

function getMimeType(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase() || '';
  return imageMimeTypes[extension] || 'image/jpeg';
}

type CloudinaryUploadResponse = {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  access_mode: string;
  moderation?: Array<{
    kind: string;
    status: 'rejected' | 'approved' | 'pending';
    response: {
      moderation_labels: Array<{
        confidence: number;
        name: string;
        parent_name: string;
      }>;
      moderation_model_version: string;
    };
    updated_at: string;
  }>;
  original_filename: string;
  original_extension: string;
};

export async function uploadImageToCloudinary(uri: string): Promise<{ url: string; isModerated: boolean }> {
  const formData = new FormData();

  const mimeType = getMimeType(uri);

  // @ts-expect-error react native does not have correct type
  formData.append('file', {
    uri: uri,
    type: mimeType,
    name: uri,
  });
  // Cloudinary does not support conditional image format transformations, so we have a different preset for gifs
  const uploadPreset = mimeType.includes('gif') ? CLOUDINARY_TOKEN_LAUNCHER_PRESET_GIFS : CLOUDINARY_TOKEN_LAUNCHER_PRESET;
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = (await response.json()) as CloudinaryUploadResponse;
  return {
    url: data.secure_url,
    isModerated: data.moderation?.[0]?.status === 'rejected',
  };
}
