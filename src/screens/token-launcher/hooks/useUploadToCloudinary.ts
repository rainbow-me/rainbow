import { useState } from 'react';
import { uploadImageToCloudinary } from '../helpers/uploadToCloudinary';
import { logger, RainbowError } from '@/logger';
import { analyticsV2 } from '@/analytics';

export function useUploadToCloudinary() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = async (uri: string) => {
    setIsUploading(true);
    let url;
    let isModerated;
    try {
      const response = await uploadImageToCloudinary(uri);
      if (!response.url) {
        throw new Error('Failed to upload image');
      }
      url = response.url;
      isModerated = response.isModerated;
      return { url, isModerated };
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      logger.error(new RainbowError('[useUploadToCloudinary]: Failed to upload image to Cloudinary'), {
        message: error.message,
      });
      analyticsV2.track(analyticsV2.event.tokenLauncherImageUploadFailed, {
        error: error.message,
        url,
        isModerated,
      });
      setError(error);
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error };
}
