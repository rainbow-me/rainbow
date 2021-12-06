import { useEffect, useState } from 'react';
import { MMKV, useMMKVString } from 'react-native-mmkv';
import { getLowResUrl } from '../utils/getLowResUrl';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/imgix' or... Remove this comment to see the full error message
import { svgToLQPng } from '@rainbow-me/handlers/imgix';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/isSupporte... Remove this comment to see the full error message
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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
  const isSVG = isSupportedUriExtension(url, ['.svg']);
  const nonSvgUrl = isSVG ? svgToLQPng(url) : url;
  const [dominantColor, setPersistentDominantColor] = useMMKVString(
    url,
    storage
  );
  const [state, setState] = useState<State>(
    dominantColor ? State.loaded : State.init
  );
  useEffect(() => {
    if (state === State.init && nonSvgUrl) {
      const lowResUrl = getLowResUrl(nonSvgUrl);
      setState(State.loading);
      getDominantColorFromImage(
        lowResUrl,
        colorToMeasureAgainst
      ).then((color: any) => setPersistentDominantColor(color));
    }
  }, [colorToMeasureAgainst, setPersistentDominantColor, state, nonSvgUrl]);

  return {
    result: dominantColor,
    state,
  };
}
