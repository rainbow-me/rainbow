import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { MMKV, useMMKVNumber } from 'react-native-mmkv';
import { STORAGE_IDS } from '@/model/mmkv';

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
  result: number | undefined;
};

export default function usePersistentAspectRatio(url: string): Result {
  const [ratio, setAspectRatio] = useMMKVNumber((url || '') as string, storage);
  const [state, setState] = useState<State>(ratio ? State.loaded : State.init);
  useEffect(() => {
    if (state === State.init && url) {
      setState(State.loading);
      Image.getSize(
        url,
        (width: number, height: number) => {
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
