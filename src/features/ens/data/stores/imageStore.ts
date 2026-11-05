import { shallowEqual } from '@storesjs/stores';

import { ImgixImage } from '@/components/images';
import { ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import svgToPngIfNeeded from '@/handlers/svgs';
import { getProvider } from '@/handlers/web3';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';
import { AvatarResolver } from '@/vendor/ens-avatar';

import { readEnsText, resolveEnsAddress } from '../ens';

export type EnsImageField = 'avatar' | 'header';

export const useEnsImageStore = createQueryCollectionStore(
  {
    key: ({ name, field }: { name: string; field: EnsImageField }) => `${name}:${field}`,
    fetcher: async ({ name, field }, signal): Promise<string | null> => {
      const [record, address] = await Promise.all([readEnsText(name, field, signal), resolveEnsAddress(name, ChainId.mainnet, signal)]);
      if (!record || !address) return null;
      const image = await new AvatarResolver(getProvider({ chainId: ChainId.mainnet })).getImage(name, record, address, {
        allowNonOwnerNFTs: true,
        transformImageUri: uri => svgToPngIfNeeded(uri, false),
      });
      if (image) ImgixImage.preload([{ uri: image }], 100);
      return image ?? null;
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
