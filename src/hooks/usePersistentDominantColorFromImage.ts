import { useEffect, useMemo, useState } from 'react';
import { MMKV } from 'react-native-mmkv';
import { STORAGE_IDS } from '@/model/mmkv';
import { getDominantColorFromImage } from '@/utils';
import { maybeSignUri } from '@/handlers/imgix';

const storage = new MMKV({
  id: STORAGE_IDS.DOMINANT_COLOR,
});

const COLOR_TO_MEASURE_AGAINST = '#333333';
const SIZE_FOR_COLOR_CALCULATION = 40;

export function usePersistentDominantColorFromImage(url?: string | null) {
  const cachedColor = useMemo(() => (url ? storage.getString(url) : undefined), [url]);
  const [color, setColor] = useState(cachedColor);
  const externalUrl = useMemo(() => (url ? maybeSignUri(url, { w: SIZE_FOR_COLOR_CALCULATION }) || url : url), [url]);

  useEffect(() => {
    if (!cachedColor && externalUrl && url) {
      getDominantColorFromImage(externalUrl, COLOR_TO_MEASURE_AGAINST)
        .then(color => {
          setColor(color);
          storage.set(url, color);
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
