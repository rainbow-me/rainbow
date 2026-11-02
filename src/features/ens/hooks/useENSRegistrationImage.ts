import { useCallback } from 'react';

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
  const change = changedRecords[field];
  const value = change ?? records[field];
  const nftRecord = isENSNFTRecord(change) ? change : undefined;

  const selectImage = useCallback(
    (data: NFTData) => {
      const image = getENSNFTAvatarUrl(data.nfts, nftRecord);
      return image ? svgToPngIfNeeded(image, false) : undefined;
    },
    [nftRecord]
  );
  const { data: nftImage } = useLegacyNFTs({ address: accountAddress, config: { enabled: !!nftRecord, select: selectImage } });

  return useEnsImageStore(s => {
    if (value === '') return '';
    if (nftRecord) return nftImage;

    if (
      value &&
      (value.startsWith('http') ||
        value.startsWith('file') ||
        ((value.startsWith('/') || value.startsWith('~')) && !/^\/(ipfs|ipns)/.test(value)))
    ) {
      return value;
    }

    if (name && (mode === REGISTRATION_MODES.EDIT || mode === REGISTRATION_MODES.RENEW || mode === REGISTRATION_MODES.SET_NAME)) {
      return s.get({ name, field });
    }
    return undefined;
  });
}
