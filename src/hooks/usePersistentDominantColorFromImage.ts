import { useEffect, useState } from 'react';
import { MMKV, useMMKVString } from 'react-native-mmkv';
import { getLowResUrl } from '../utils/getLowResUrl';
import { getDominantColorFromImage } from '@rainbow-me/utils';

const id = 'DOMINANT_COLOR';
enum State {
  init,
  loading,
  loaded,
  failed,
}

const storage = new MMKV({
  id,
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
    url,
    storage
  );
  const [state, setState] = useState<State>(
    dominantColor ? State.loaded : State.init
  );
  useEffect(() => {
    if (state === State.init && url) {
      const lowResUrl = getLowResUrl(url);
      setState(State.loading);
      getDominantColorFromImage(lowResUrl, colorToMeasureAgainst).then(color =>
        // @ts-ignore
        setPersistentDominantColor(color)
      );
    }
  }, [colorToMeasureAgainst, setPersistentDominantColor, state, url]);
  return {
    result: dominantColor,
    state,
  };
}
