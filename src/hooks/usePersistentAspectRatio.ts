import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { MMKV, useMMKVNumber } from 'react-native-mmkv';
import { getLowResUrl } from '../utils/getLowResUrl';
import { imageToPng } from '@rainbow-me/handlers/imgix';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import { STORAGE_IDS } from '@rainbow-me/model/mmkv';

const storage = new MMKV({
  id: STORAGE_IDS.ASPECT_RATIO,
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
  const nonSvgUrl = isSVG ? imageToPng(url, 200) : url;
  const [ratio, setAspectRatio] = useMMKVNumber(
    (nonSvgUrl || '') as string,
    storage
  );
  const [state, setState] = useState<State>(
    ratio !== 0 ? State.loaded : State.init
  );
  useEffect(() => {
    if (state === State.init && nonSvgUrl && url) {
      const lowResUrl = getLowResUrl(nonSvgUrl) as string;
      setState(State.loading);
      Image.getSize(
        lowResUrl,
        (width, height) => {
          setAspectRatio(width / height);
          setState(State.loaded);
        },
        () => setState(State.failed)
      );
    } else {
      setAspectRatio(1);
      setState(State.loaded);
    }
  }, [setAspectRatio, state, nonSvgUrl, url]);
  return {
    result: ratio,
    state,
  };
}
