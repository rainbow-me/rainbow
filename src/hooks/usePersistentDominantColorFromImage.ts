import { useEffect, useState } from 'react';
import { PixelRatio } from 'react-native';
import { MMKV, useMMKVString } from 'react-native-mmkv';
import { GOOGLE_USER_CONTENT_URL } from '../components/expanded-state/unique-token/UniqueTokenExpandedStateContent';
import { CardSize } from '../components/unique-token/CardSize';
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
  result: string;
};

const size = Math.ceil(CardSize) * PixelRatio.get();
const getLowResUrl = (url: string) => {
  if (url?.startsWith?.(GOOGLE_USER_CONTENT_URL)) {
    return `${url}=w${size}`;
  }
  return url;
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
