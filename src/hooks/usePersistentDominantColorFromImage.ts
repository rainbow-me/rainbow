import { useEffect, useMemo, useState } from 'react';
import { MMKV } from 'react-native-mmkv';
import { STORAGE_IDS } from '@/model/mmkv';
import { getDominantColorFromImage } from '@/utils';
import { maybeSignUri } from '@/handlers/imgix';

export const storage = new MMKV({
  id: STORAGE_IDS.DOMINANT_COLOR,
});

const COLOR_TO_MEASURE_AGAINST = '#333333';
const SIZE_FOR_COLOR_CALCULATION = 40;

export function getCachedImageColor(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return storage.getString(url);
}

export async function calculateAndCacheDominantColor(url: string | null | undefined): Promise<string | undefined> {
  if (!url) return Promise.resolve(undefined);

  // Check if already cached
  const cachedColor = getCachedImageColor(url);
  if (cachedColor) return Promise.resolve(cachedColor);

  // Process the URL
  const externalUrl = maybeSignUri(url, { w: SIZE_FOR_COLOR_CALCULATION }) || url;

  // Calculate and cache
  return getDominantColorFromImage(externalUrl, COLOR_TO_MEASURE_AGAINST)
    .then(color => {
      storage.set(url, color);
      return color;
    })
    .catch(() => undefined);
}

export function usePersistentDominantColorFromImage(url?: string | null) {
  const cachedColor = useMemo(() => (url ? storage.getString(url) : undefined), [url]);
  const [color, setColor] = useState(cachedColor);
  const externalUrl = useMemo(() => (url ? maybeSignUri(url, { w: SIZE_FOR_COLOR_CALCULATION }) || url : url), [url]);

  useEffect(() => {
    if (!cachedColor && externalUrl && url) {
      calculateAndCacheDominantColor(url)
        .then(color => {
          setColor(color);
        })
        .catch(() => {
          setColor(undefined);
        });
    } else {
      setColor(cachedColor);
    }
  }, [setColor, cachedColor, externalUrl, url]);

  return color;
}
