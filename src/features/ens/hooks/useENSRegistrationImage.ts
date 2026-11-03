import { useCallback, useMemo } from 'react';

import svgToPngIfNeeded from '@/handlers/svgs';
import { useLegacyNFTs, type NFTData } from '@/resources/nfts';

import { findRecordNft, parseNftRecord } from '../core/nftRecord';
import { isDirectImagePath } from '../core/records';
import { useEnsImageStore, type EnsImageField } from '../data/stores/imageStore';
import { REGISTRATION_MODES } from '../utils/helpers';
import { useENSRegistration } from './useENSRegistration';

/**
 * Resolves one registration image, including pending replacements and removals.
 */
export function useENSRegistrationImage(field: EnsImageField) {
  const { accountAddress, name, mode, records, changedRecords } = useENSRegistration();
  const change = changedRecords[field];
  const nftRecord = useMemo(() => parseNftRecord(change), [change]);
  const preview = getDraftImagePreview(change ?? records[field]);
  const usesExistingName = mode === REGISTRATION_MODES.EDIT || mode === REGISTRATION_MODES.RENEW || mode === REGISTRATION_MODES.SET_NAME;
  const shouldLoadImage = usesExistingName && !!name && !nftRecord && preview === undefined;

  const nftImage = useNftRecordImage(accountAddress, nftRecord);
  const storedImage = useEnsImageStore(s => s.get(shouldLoadImage ? { name, field } : undefined));

  return nftRecord ? nftImage : (preview ?? storedImage);
}

function useNftRecordImage(address: string, record: ReturnType<typeof parseNftRecord>) {
  const select = useCallback(
    (data: NFTData) => {
      const nft = findRecordNft(data.nfts, record);
      return svgToPngIfNeeded(nft?.images.highResUrl || nft?.images.lowResUrl);
    },
    [record]
  );
  return useLegacyNFTs({ address, config: { enabled: !!record, select } }).data;
}

function getDraftImagePreview(value: string | undefined): string | undefined {
  if (value === '') return '';
  if (value && (value.startsWith('http') || value.startsWith('file') || value.startsWith('~') || isDirectImagePath(value))) {
    return value;
  }
  return undefined;
}
