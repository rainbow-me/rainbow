import { useEffect, useState } from 'react';
import { MMKV, useMMKVString } from 'react-native-mmkv';
import { STORAGE_IDS } from '@rainbow-me/model/mmkv';
import { getDominantColorFromImage } from '@rainbow-me/utils';

enum State {
  init,
  loading,
  loaded,
  failed,
}

const storage = new MMKV({
  id: STORAGE_IDS.DOMINANT_COLOR,
});

type Result = {
  state: State;
  result: string | undefined;
};

export default function usePersistentDominantColorFromImage(
  url: string,
  colorToMeasureAgainst: string = '#333333'
): Result {
  const [dominantColor, setPersistentDominantColor] = useMMKVString(
    (url || '') as string,
    storage
  );

  const [state, setState] = useState<State>(
    dominantColor ? State.loaded : url ? State.loading : State.init
  );
  useEffect(() => {
    if (!dominantColor) {
      if (url) {
        setState(State.loading);
      } else {
        setState(State.init);
      }
    }
  }, [dominantColor, url]);

  useEffect(() => {
    if ((state === State.loading || state === State.init) && url) {
      setState(State.loading);
      getDominantColorFromImage(url, colorToMeasureAgainst)
        .then(color => {
          // @ts-ignore
          setPersistentDominantColor(color);
        })
        .finally(() => {
          setState(State.loaded);
        });
    }
  }, [colorToMeasureAgainst, setPersistentDominantColor, state, url]);

  return {
    result: dominantColor,
    state,
  };
}
