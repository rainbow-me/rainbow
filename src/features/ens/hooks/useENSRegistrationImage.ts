import { useCallback, useMemo } from 'react';

import svgToPngIfNeeded from '@/handlers/svgs';
import { useLegacyNFTs, type NFTData } from '@/resources/nfts';

import { useEnsImageStore } from '../data/stores/imageStore';
import { REGISTRATION_MODES } from '../utils/helpers';
import { getENSNFTAvatarUrl, isENSNFTRecord } from '../utils/records';
import { useENSRegistration } from './useENSRegistration';

/**
 * Resolves one registration image, including pending replacements and removals.
 */
export function useENSRegistrationImage(field: 'avatar' | 'header') {
  const { accountAddress, name, mode, records, changedRecords } = useENSRegistration();
  const value = records[field];
  const removed = changedRecords[field] === '' && mode === REGISTRATION_MODES.EDIT;
  const fetchEnabled = mode === REGISTRATION_MODES.EDIT || mode === REGISTRATION_MODES.RENEW || mode === REGISTRATION_MODES.SET_NAME;
  const image = useEnsImageStore(s => (fetchEnabled && name ? s.get({ name, field }) : undefined));
  const isNFT = isENSNFTRecord(value);
  const selectImage = useCallback((data: NFTData) => getENSNFTAvatarUrl(data.nfts, value), [value]);
  const { data: nftImage } = useLegacyNFTs({ address: accountAddress, config: { enabled: !!isNFT, select: selectImage } });

  return useMemo(() => {
    if (removed) return '';
    if (!value) return image;
    if (isNFT) return nftImage ? svgToPngIfNeeded(nftImage, false) : image;
    if (
      value.startsWith('http') ||
      value.startsWith('file') ||
      ((value.startsWith('/') || value.startsWith('~')) && !/^\/(ipfs|ipns)/.test(value))
    ) {
      return value;
    }
    return image;
  }, [image, isNFT, nftImage, removed, value]);
}
