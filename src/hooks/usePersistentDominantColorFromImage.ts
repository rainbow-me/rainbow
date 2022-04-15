import { useEffect, useState } from 'react';
import { MMKV, useMMKVString } from 'react-native-mmkv';
import { getLowResUrl } from '../utils/getLowResUrl';
import { imageToPng } from '@rainbow-me/handlers/imgix';
import { STORAGE_IDS } from '@rainbow-me/model/mmkv';
import { getDominantColorFromImage } from '@rainbow-me/utils';
import isSVGImage from '@rainbow-me/utils/isSVG';

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
  const isSVG = isSVGImage(url);
  const nonSvgUrl = isSVG ? imageToPng(url, 200) : url;
  const [dominantColor, setPersistentDominantColor] = useMMKVString(
    url || '',
    storage
  );

  const [state, setState] = useState<State>(
    dominantColor ? State.loaded : State.init
  );
  useEffect(() => {
    if (!dominantColor) {
      setState(State.init);
    }
  }, [dominantColor]);

  useEffect(() => {
    if (state === State.init && nonSvgUrl && url) {
      const lowResUrl = getLowResUrl(nonSvgUrl) as string;
      setState(State.loading);
      getDominantColorFromImage(lowResUrl, colorToMeasureAgainst).then(color =>
        // @ts-ignore
        setPersistentDominantColor(color)
      );
    }
  }, [
    colorToMeasureAgainst,
    setPersistentDominantColor,
    state,
    nonSvgUrl,
    url,
  ]);

  return {
    result: dominantColor,
    state,
  };
}
