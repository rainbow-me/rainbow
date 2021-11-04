import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { MMKV, useMMKVNumber } from 'react-native-mmkv';
import { getLowResUrl } from '../utils/getLowResUrl';

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
  const [ratio, setAspectRatio] = useMMKVNumber(url, storage);
  const [state, setState] = useState<State>(ratio ? State.loaded : State.init);
  useEffect(() => {
    if (state === State.init && url) {
      const lowResUrl = getLowResUrl(url);
      setState(State.loading);
      Image.getSize(
        lowResUrl,
        (width, height) => {
          // @ts-ignore
          setAspectRatio(width / height);
          setState(State.loaded);
        },
        () => setState(State.failed)
      );
    }
  }, [setAspectRatio, state, url]);
  return {
    result: ratio,
    state,
  };
}
