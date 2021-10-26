import { useEffect, useState } from 'react';
import { Image, PixelRatio } from 'react-native';
import { MMKV, useMMKVNumber } from 'react-native-mmkv';
import { GOOGLE_USER_CONTENT_URL } from '../components/expanded-state/unique-token/UniqueTokenExpandedStateContent';
import { CardSize } from '../components/unique-token/CardSize';

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

const size = Math.ceil(CardSize) * PixelRatio.get();

const getLowResUrl = (url: string) => {
  if (url?.startsWith?.(GOOGLE_USER_CONTENT_URL)) {
    return `${url}=w${size}`;
  }
  return url;
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
