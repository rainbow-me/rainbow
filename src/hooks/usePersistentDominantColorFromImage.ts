import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MMKV } from 'react-native-mmkv';
import { STORAGE_IDS } from '@/model/mmkv';
import { getDominantColorFromImage } from '@/utils';
import { maybeSignUri } from '@/handlers/imgix';
import usePrevious from './usePrevious';

const DEFAULT_MMKV_KEY = 'DEFAULT_MMKV_KEY';
const NOT_DEFINED_MMKV_VALUE = 'NOT_DEFINED';
const storage = new MMKV({
  id: STORAGE_IDS.DOMINANT_COLOR,
});
// settings a default value to easily check against it instead of just undefined and to make the value be always a string
storage.set(DEFAULT_MMKV_KEY, NOT_DEFINED_MMKV_VALUE);

const DEFAULT_COLOR_TO_MEASURE_AGAINST = '#333333';
const DEFAULT_SIZE_FOR_COLOR_PROBING = 80;

export function usePersistentDominantColorFromImage(
  url: string | undefined | null,
  colorToMeasureAgainst = DEFAULT_COLOR_TO_MEASURE_AGAINST
) {
  const previousUrl = usePrevious(url);
  const didInitialize = useRef(false);
  const externalUrl = useMemo(() => {
    if (url) {
      return maybeSignUri(url, { w: DEFAULT_SIZE_FOR_COLOR_PROBING });
    }
    return undefined;
  }, [url]);
  const currentCachedValue = storage.getString(url || DEFAULT_MMKV_KEY);
  const [dominantColor, setDominantColor] = useState(
    currentCachedValue !== NOT_DEFINED_MMKV_VALUE
      ? currentCachedValue
      : undefined
  );
  const [loading, setLoading] = useState(currentCachedValue === undefined);

  const checkIfCacheExistsAndSetColor = useCallback((): boolean => {
    if (currentCachedValue && currentCachedValue !== NOT_DEFINED_MMKV_VALUE) {
      setDominantColor(currentCachedValue);
      setLoading(false);
      return true;
    }
    return false;
  }, [currentCachedValue]);

  const fetchAndSetColor = useCallback(() => {
    if (!url || !externalUrl) {
      setDominantColor(undefined);
      setLoading(false);
      return;
    }
    setLoading(true);
    getDominantColorFromImage(externalUrl, colorToMeasureAgainst)
      .then(color => {
        setDominantColor(color);
        setLoading(false);
        // We use original URL as a cache key
        storage.set(url, color);
      })
      .catch(() => {
        setDominantColor(undefined);
        setLoading(false);
      });
  }, [colorToMeasureAgainst, externalUrl, url]);

  useEffect(() => {
    if (!url || !externalUrl) {
      setDominantColor(undefined);
      setLoading(false);
      return;
    }
    if (!didInitialize.current || url !== previousUrl) {
      didInitialize.current = true;
      const alreadyCached = checkIfCacheExistsAndSetColor();
      if (!alreadyCached) {
        fetchAndSetColor();
      }
    }
  }, [
    checkIfCacheExistsAndSetColor,
    externalUrl,
    fetchAndSetColor,
    previousUrl,
    url,
  ]);

  return useMemo(
    () => ({
      dominantColor,
      loading,
    }),
    [dominantColor, loading]
  );
}
