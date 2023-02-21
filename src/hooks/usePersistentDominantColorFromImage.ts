import React from 'react';
import { MMKV } from 'react-native-mmkv';

import { STORAGE_IDS } from '@/model/mmkv';
import { getDominantColorFromImage } from '@/utils';
import { maybeSignUri } from '@/handlers/imgix';

const DEFAULT_COLOR_TO_MEASURE_AGAINST = '#333333';
const DEFAULT_SIZE_FOR_COLOR_PROBING = 80;
const storage = new MMKV({
  id: STORAGE_IDS.DOMINANT_COLOR,
});

export function usePersistentDominantColorFromImage(
  url?: string | null,
  colorToMeasureAgainst = DEFAULT_COLOR_TO_MEASURE_AGAINST
) {
  /**
   * Returns the cached color or undefined.
   *
   * Will update if `url` changes.
   */
  const cachedColor = React.useMemo(
    () => (url ? storage.getString(url) : undefined),
    [url]
  );
  /**
   * Prefill state with cached color, if available
   */
  const [color, setColor] = React.useState(cachedColor);
  /**
   * Potentially signs the `url` and returns it, or falls back to the raw
   * `url`, which may already be signed.
   */
  const externalUrl = React.useMemo(
    () =>
      url
        ? maybeSignUri(url, { w: DEFAULT_SIZE_FOR_COLOR_PROBING }) || url
        : url,
    [url]
  );

  /**
   * Only Runs if `url`/`externalUrl` or `colorToMeasureAgainst` changes
   */
  React.useEffect(() => {
    /**
     * If we have a `cachedColor`, always skip, since that value will update as
     * the `url` prop passed in changes.
     *
     * `externalUrl` check here is for TypeScript and to ensure that `url` must
     * also be defined.
     */
    if (!cachedColor && externalUrl) {
      getDominantColorFromImage(externalUrl, colorToMeasureAgainst)
        .then(color => {
          setColor(color);
          // @ts-ignore If `externalUrl` is defined, `url` is defined
          storage.set(url, color);
        })
        .catch(() => {
          setColor(undefined);
        });
    }
  }, [setColor, cachedColor, externalUrl, colorToMeasureAgainst]);

  return {
    dominantColor: color,
    loading: !color,
  };
}
