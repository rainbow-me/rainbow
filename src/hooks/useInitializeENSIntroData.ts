import { useCallback } from 'react';
import { prefetchENSAddress } from './useENSAddress';
import { prefetchENSAvatar } from './useENSAvatar';
import { prefetchENSCover } from './useENSCover';
import { prefetchENSRecords } from './useENSRecords';
import { ensIntroMarqueeNames } from '@rainbow-me/references';

export default function useInitializeENSIntroData() {
  const initializeENSIntroData = useCallback(async () => {
    // We won't prefetch ENS data on Android – invoking RPC calls is
    // not performant on Android & causes some of the UI to hang.
    if (android) return;

    await Promise.all(
      ensIntroMarqueeNames.map(async name => {
        prefetchENSAddress(name, { cacheFirst: true });
        prefetchENSAvatar(name, { cacheFirst: true });
        prefetchENSCover(name, { cacheFirst: true });
        prefetchENSRecords(name, { cacheFirst: true });
      })
    );
  }, []);

  return initializeENSIntroData;
}
