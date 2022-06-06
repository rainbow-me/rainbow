import { useCallback } from 'react';
import { prefetchENSProfile } from './useENSProfile';
import { prefetchENSProfileImages } from './useENSProfileImages';
import { prefetchENSResolveName } from './useENSResolveName';
import { ensIntroMarqueeNames } from '@rainbow-me/references';

export default function useInitializeENSIntroData() {
  const initializeENSIntroData = useCallback(async () => {
    await Promise.all(
      ensIntroMarqueeNames.map(async name => {
        prefetchENSResolveName(name);
        prefetchENSProfileImages({ name });
        prefetchENSProfile({ name });
      })
    );
  }, []);

  return initializeENSIntroData;
}
