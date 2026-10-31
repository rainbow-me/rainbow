import { useEffect, useMemo } from 'react';

import type { UniqueAsset } from '@/entities/uniqueAssets';
import svgToPngIfNeeded from '@/handlers/svgs';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';

import { useEnsRegistrationStore } from '../data/stores/registrationStore';
import type { Records } from '../types/registration';
import { REGISTRATION_MODES } from '../utils/helpers';
import { getENSNFTAvatarUrl, isENSNFTRecord, parseENSNFTRecord } from '../utils/records';
import useENSAvatar from './useENSAvatar';
import useENSCover from './useENSCover';
import useENSRecords from './useENSRecords';
import { useENSRegistration } from './useENSRegistration';

const getImageUrl = (
  key: 'avatar' | 'header',
  records: Records,
  changedRecords: Records,
  uniqueTokens: UniqueAsset[],
  defaultValue?: string | null,
  mode?: keyof typeof REGISTRATION_MODES
) => {
  const recordValue = records?.[key];
  let imageUrl = getENSNFTAvatarUrl(uniqueTokens, records?.[key]) || defaultValue;

  if (changedRecords[key] === '' && mode === REGISTRATION_MODES.EDIT) {
    // If the image has been removed, update accordingly.
    imageUrl = '';
  } else if (recordValue) {
    const isNFT = isENSNFTRecord(recordValue);
    if (isNFT) {
      const { contractAddress, tokenId } = parseENSNFTRecord(records?.[key] || '');
      const uniqueToken = uniqueTokens.find(
        token => isLowerCaseMatch(token.contractAddress, contractAddress) && isLowerCaseMatch(token.tokenId, tokenId)
      );
      if (uniqueToken?.images.highResUrl) {
        imageUrl = svgToPngIfNeeded(uniqueToken.images.highResUrl, false);
      } else if (uniqueToken?.images.lowResUrl) {
        imageUrl = uniqueToken.images.lowResUrl;
      }
    } else if (
      recordValue?.startsWith('http') ||
      recordValue?.startsWith('file') ||
      ((recordValue?.startsWith('/') || recordValue?.startsWith('~')) && !recordValue?.match(/^\/(ipfs|ipns)/))
    ) {
      imageUrl = recordValue;
    }
  }
  return imageUrl;
};

export function useENSModifiedRegistration({
  setInitialRecordsWhenInEditMode = false,
}: {
  /** When true, an update to `initialRecords` will be triggered when the flow is in "edit mode". */
  setInitialRecordsWhenInEditMode?: boolean;
} = {}) {
  const { records, changedRecords, name, mode } = useENSRegistration();
  const accountAddress = useAccountAddress();

  const {
    data: { nfts: uniqueTokens },
  } = useLegacyNFTs({
    address: accountAddress,
  });

  const fetchEnabled = mode === REGISTRATION_MODES.EDIT || mode === REGISTRATION_MODES.RENEW || mode === REGISTRATION_MODES.SET_NAME;
  const { data: avatar } = useENSAvatar(name, {
    enabled: fetchEnabled,
  });
  const { data: cover } = useENSCover(name, {
    enabled: fetchEnabled,
  });
  const { data: { coinAddresses: fetchedCoinAddresses, contenthash: fetchedContenthash, records: fetchedRecords } = {} } = useENSRecords(
    name,
    {
      enabled: fetchEnabled,
    }
  );

  const hasRecords = fetchedRecords !== undefined;

  useEffect(() => {
    if (setInitialRecordsWhenInEditMode && mode === REGISTRATION_MODES.EDIT && hasRecords) {
      const initialRecords = {
        contenthash: fetchedContenthash,
        ...fetchedRecords,
        ...fetchedCoinAddresses,
      } as Records;
      useEnsRegistrationStore.getState().initializeRecords(accountAddress, name, initialRecords);
    }
  }, [accountAddress, name, mode, fetchedCoinAddresses, fetchedRecords, hasRecords, setInitialRecordsWhenInEditMode, fetchedContenthash]);

  // Since `records.avatar` is not a reliable source for an avatar URL
  // (the avatar can be an NFT), then if the avatar is an NFT, we will
  // parse it to obtain the URL.
  const images = useMemo(() => {
    const avatarUrl = getImageUrl('avatar', records, changedRecords, uniqueTokens, avatar?.imageUrl, mode);
    const coverUrl = getImageUrl('header', records, changedRecords, uniqueTokens, cover?.imageUrl, mode);

    return {
      avatarUrl,
      coverUrl,
    };
  }, [records, changedRecords, uniqueTokens, avatar?.imageUrl, mode, cover?.imageUrl]);

  return {
    changedRecords,
    images,
    hasRecords,
  };
}
