import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { MMKV, useMMKVNumber } from 'react-native-mmkv';
import { getLowResUrl } from '../utils/getLowResUrl';
import { svgToLQPng } from '@rainbow-me/handlers/imgix';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';

const id = 'ASPECT_RATIO';

const storage = new MMKV({
  id,
});

enum State {
  init,
  loading,
  loaded,
  failed,
}

type Result = {
  state: State;
  result: number;
};

export default function usePersistentAspectRatio(url: string): Result {
  const isSVG = isSupportedUriExtension(url, ['.svg']);
  const nonSvgUrl = isSVG ? svgToLQPng(url) : url;
  const [ratio, setAspectRatio] = useMMKVNumber(nonSvgUrl as string, storage);
  const [state, setState] = useState<State>(
    ratio !== 0 ? State.loaded : State.init
  );
  useEffect(() => {
    if (state === State.init && nonSvgUrl) {
      const lowResUrl = getLowResUrl(nonSvgUrl);
      setState(State.loading);
      Image.getSize(
        lowResUrl,
        (width, height) => {
          setAspectRatio(width / height);
          setState(State.loaded);
        },
        () => setState(State.failed)
      );
    }
  }, [setAspectRatio, state, nonSvgUrl]);
  return {
    result: ratio,
    state,
  };
}
