import { useEffect, useMemo, useState } from 'react';
import { MMKV, useMMKVString } from 'react-native-mmkv';
import { STORAGE_IDS } from '@rainbow-me/model/mmkv';
import { getDominantColorFromImage } from '@rainbow-me/utils';
import { maybeSignUri } from '@/handlers/imgix';

enum State {
  init,
  loading,
  loaded,
  failed,
}

const storage = new MMKV({
  id: STORAGE_IDS.DOMINANT_COLOR,
});

const DEFAULT_MMKV_KEY = 'DEFAULT_MMKV_KEY';
const DEFAULT_COLOR_TO_MEASURE_AGAINST = '#333333';

const deriveInitialState = (
  dominantColor: string | undefined,
  url: string | undefined | null
) => {
  if (dominantColor) {
    return State.loaded;
  } else if (url) {
    return State.loading;
  } else {
    return State.init;
  }
};

type Result = {
  state: State;
  result: string | undefined;
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
  const { colorToMeasureAgainst: passedColor, signUrl } = options;
  const externalUrl = useMemo(
    () => (signUrl && url ? maybeSignUri(url) : url),
    [signUrl, url]
  );
  const colorToMeasureAgainst = passedColor ?? DEFAULT_COLOR_TO_MEASURE_AGAINST;
  const [dominantColor, setPersistentDominantColor] = useMMKVString(
    url || DEFAULT_MMKV_KEY,
    storage
  );
  const [state, setState] = useState<State>(
    deriveInitialState(dominantColor, url)
  );

  useEffect(() => {
    deriveInitialState(dominantColor, url);
  }, [dominantColor, url]);

  useEffect(() => {
    if (state === State.init && externalUrl) {
      setState(State.loading);
      getDominantColorFromImage(externalUrl, colorToMeasureAgainst)
        .then(color => {
          setPersistentDominantColor(color);
        })
        .finally(() => {
          setState(State.loaded);
        })
        .catch(() => {
          setState(State.failed);
        });
    }
  }, [colorToMeasureAgainst, externalUrl, setPersistentDominantColor, state]);

  return {
    result: dominantColor,
    state,
  };
}
