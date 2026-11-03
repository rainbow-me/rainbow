import { shallowEqual } from '@storesjs/stores';

import { ImgixImage } from '@/components/images';
import { time } from '@/framework/core/utils/time';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';

import { readEnsText } from '../ens';
import { resolveImageRecord } from '../image';

export type EnsImageField = 'avatar' | 'header';

export const useEnsImageStore = createQueryCollectionStore(
  {
    key: (input: { name: string; field: EnsImageField }) => `${input.name}:${input.field}`,
    fetcher: async (input, signal): Promise<string | null> => {
      const record = await readEnsText(input.name, input.field, signal);
      const image = record ? await resolveImageRecord(record, signal) : null;
      if (image) ImgixImage.preload([{ uri: image }], 100);
      return image;
    },
    disableAutoRefetching: true,
    staleTime: time.seconds(10),
    cacheTime: Infinity,
  },
  { storageKey: 'ensImages' }
);

/** Reads a profile image and whether its lookup has finished, including a missing image or a failed lookup. */
export function useEnsProfileImage(name: string | undefined, field: EnsImageField) {
  const input = name ? { name, field } : undefined;
  return useEnsImageStore(s => ({ url: s.get(input), isSettled: s.hasSettled(input) }), shallowEqual);
}
