import { useCallback } from 'react';
import { prefetchENSProfile } from './useENSProfile';
import { ensIntroMarqueeNames } from '@rainbow-me/references';

export default function useInitializeENSIntroData() {
  const initializeENSIntroData = useCallback(async () => {
    await Promise.all(
      ensIntroMarqueeNames.map(async name => {
        prefetchENSProfile({
          cacheFirst: true,
          name,
          select: ['images', ...(ios ? (['primary', 'records'] as any) : [])],
        });
      })
    );
  }, []);

  return initializeENSIntroData;
}
