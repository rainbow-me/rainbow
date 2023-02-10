import { useCallback, useEffect, useMemo, useState } from 'react';
import { MMKV, useMMKVString } from 'react-native-mmkv';
import { STORAGE_IDS } from '@/model/mmkv';
import { getDominantColorFromImage } from '@/utils';
import { maybeSignUri } from '@/handlers/imgix';
import usePrevious from './usePrevious';

enum State {
  init,
  loading,
  loaded,
  failed,
}

const DEFAULT_MMKV_KEY = 'DEFAULT_MMKV_KEY';
const NOT_DEFINED_MMKV_VALUE = 'NOT_DEFINED';
const storage = new MMKV({
  id: STORAGE_IDS.DOMINANT_COLOR,
});
storage.set(DEFAULT_MMKV_KEY, NOT_DEFINED_MMKV_VALUE);

const DEFAULT_COLOR_TO_MEASURE_AGAINST = '#333333';
const DEFAULT_SIZE_FOR_COLOR_PROBING = 80;

type Result = {
  result: string | undefined;
  retry: () => void;
  state: State;
};

type ConfigOptions = {
  colorToMeasureAgainst?: string;
  signUrl?: boolean;
};
export default function usePersistentDominantColorFromImage(
  url: string | undefined | null,
  options: ConfigOptions = {
    colorToMeasureAgainst: DEFAULT_COLOR_TO_MEASURE_AGAINST,
    signUrl: false,
  }
): Result {
  const previousUrl = usePrevious(url);
  const { colorToMeasureAgainst: passedColor, signUrl } = options;
  const externalUrl = useMemo(
    () =>
      signUrl && url
        ? maybeSignUri(url, { w: DEFAULT_SIZE_FOR_COLOR_PROBING })
        : url,
    [signUrl, url]
  );
  const colorToMeasureAgainst = passedColor ?? DEFAULT_COLOR_TO_MEASURE_AGAINST;
  const [dominantColor, setPersistentDominantColor] = useMMKVString(
    url || DEFAULT_MMKV_KEY,
    storage
  );
  const currentStoreValue = storage.getString(url || DEFAULT_MMKV_KEY);
  const [state, setState] = useState<State>(
    currentStoreValue !== NOT_DEFINED_MMKV_VALUE ? State.loaded : State.init
  );

  useEffect(() => {
    if (
      currentStoreValue !== NOT_DEFINED_MMKV_VALUE &&
      currentStoreValue !== undefined
    ) {
      setState(State.loaded);
    } else if (externalUrl && (state === State.init || url !== previousUrl)) {
      setState(State.loading);
      getDominantColorFromImage(externalUrl, colorToMeasureAgainst)
        .then(color => {
          setPersistentDominantColor(color);
          setState(State.loaded);
        })
        .catch(() => {
          setState(State.failed);
        });
    }
  }, [
    colorToMeasureAgainst,
    externalUrl,
    setPersistentDominantColor,
    state,
    url,
    previousUrl,
  ]);

  const retry = useCallback(() => {
    setState(State.init);
  }, []);

  return useMemo(
    () => ({
      result:
        dominantColor === NOT_DEFINED_MMKV_VALUE ? undefined : dominantColor,
      retry,
      state,
    }),
    [state, dominantColor, retry]
  );
}
