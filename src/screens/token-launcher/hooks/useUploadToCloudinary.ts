import { useState } from 'react';
import { uploadImageToCloudinary } from '../helpers/uploadToCloudinary';
import { logger, RainbowError } from '@/logger';

export function useUploadToCloudinary() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = async (uri: string) => {
    setIsUploading(true);
    try {
      return await uploadImageToCloudinary(uri);
    } catch (e) {
      const error = e as Error;
      logger.error(new RainbowError('[useUploadToCloudinary]: uploadImageToCloudinary failed'), {
        message: error.message,
      });
      setError(error);
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error };
}
