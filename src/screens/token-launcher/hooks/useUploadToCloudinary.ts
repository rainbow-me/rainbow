import { useState } from 'react';
import { uploadImageToCloudinary } from '../helpers/uploadToCloudinary';
import { logger, RainbowError } from '@/logger';

export function useUploadToCloudinary() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = async (uri: string) => {
    setIsUploading(true);
    try {
      const url = await uploadImageToCloudinary(uri);
      if (!url) {
        throw new Error('Failed to upload image');
      }
      return url;
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      logger.error(new RainbowError('[useUploadToCloudinary]: Failed to upload image to Cloudinary'), {
        message: error.message,
      });
      setError(error);
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error };
}
