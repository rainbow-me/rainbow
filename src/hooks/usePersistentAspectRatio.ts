import { useEffect } from 'react';
import { Image } from 'react-native';

import { createMMKV, useMMKVNumber } from 'react-native-mmkv';

import { STORAGE_IDS } from '@/model/mmkv';

const storage = createMMKV({
  id: STORAGE_IDS.ASPECT_RATIO,
});

type Result = {
  result: number | undefined;
};

export default function usePersistentAspectRatio(url: string | null | undefined): Result {
  const [ratio, setAspectRatio] = useMMKVNumber(url ?? '', storage);
  useEffect(() => {
    if (!url || ratio !== undefined) return;
    Image.getSize(
      url,
      (width, height) => setAspectRatio(width / height),
      () => undefined
    );
  }, [ratio, setAspectRatio, url]);
  return {
    result: ratio,
  };
}
