import { ImgixImage } from '@/components/images';
import { ChainId } from '@/features/network/types/backendNetworks';
import svgToPngIfNeeded from '@/handlers/svgs';
import { getProvider } from '@/handlers/web3';
import { AvatarResolver } from '@/vendor/ens-avatar';

import { readEnsText, resolveEnsAddress } from '../data/ens';
import { getENSData, saveENSData } from './localStorage';

export async function fetchENSImage(imageType: 'avatar' | 'header', ensName: string): Promise<{ imageUrl: string | null | undefined }> {
  let imageUrl;
  const provider = getProvider({ chainId: ChainId.mainnet });
  try {
    const [address, record] = await Promise.all([resolveEnsAddress(ensName, ChainId.mainnet), readEnsText(ensName, imageType)]);
    imageUrl =
      address && record
        ? await new AvatarResolver(provider).getImage(ensName, record, address, {
            allowNonOwnerNFTs: true,
            transformImageUri: uri => svgToPngIfNeeded(uri, false),
          })
        : null;
    ImgixImage.preload([...(imageUrl ? [{ uri: imageUrl }] : [])], 100);
    saveENSData(imageType, ensName, { imageUrl });
  } catch {
    const data = await getENSData(imageType, ensName);
    imageUrl = data?.imageUrl;
  }

  return { imageUrl };
}
