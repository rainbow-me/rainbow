import { differenceWith, isEqual } from 'lodash';
import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useAccountSettings, useENSAvatar, useENSCover, useENSRecords, useENSRegistration, usePrevious } from '.';
import { Records, UniqueAsset } from '@/entities';
import svgToPngIfNeeded from '@/handlers/svgs';
import { deprecatedTextRecordFields, REGISTRATION_MODES } from '@/helpers/ens';
import * as ensRedux from '@/redux/ensRegistration';
import { getENSNFTAvatarUrl, isENSNFTRecord, parseENSNFTRecord } from '@/utils';
import { useLegacyNFTs } from '@/resources/nfts';

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
      const uniqueToken = uniqueTokens.find(token => token.asset_contract.address === contractAddress && token.id === tokenId);
      if (uniqueToken?.image_url) {
        imageUrl = svgToPngIfNeeded(uniqueToken?.image_url, false);
      } else if (uniqueToken?.lowResUrl) {
        imageUrl = uniqueToken?.lowResUrl;
      } else if (uniqueToken?.image_thumbnail_url) {
        imageUrl = uniqueToken?.image_thumbnail_url;
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

export default function useENSModifiedRegistration({
  setInitialRecordsWhenInEditMode = false,
  modifyChangedRecords = false,
}: {
  /** When true, an update to `initialRecords` will be triggered when the flow is in "edit mode". */
  setInitialRecordsWhenInEditMode?: boolean;
  modifyChangedRecords?: boolean;
} = {}) {
  const dispatch = useDispatch();
  const { records, initialRecords, name, mode } = useENSRegistration();
  const { accountAddress } = useAccountSettings();

  const {
    data: { nfts: uniqueTokens },
  } = useLegacyNFTs({
    address: accountAddress,
  });

  const fetchEnabled = mode === REGISTRATION_MODES.EDIT || mode === REGISTRATION_MODES.RENEW || mode === REGISTRATION_MODES.SET_NAME;
  const { data: avatar, isSuccess: isAvatarSuccess } = useENSAvatar(name, {
    enabled: fetchEnabled,
  });
  const { data: cover, isSuccess: isCoverSuccess } = useENSCover(name, {
    enabled: fetchEnabled,
  });
  const {
    data: { coinAddresses: fetchedCoinAddresses, contenthash: fetchedContenthash, records: fetchedRecords } = {},
    isSuccess: isRecordsSuccess,
  } = useENSRecords(name, {
    enabled: fetchEnabled,
  });

  const isSuccess = isAvatarSuccess && isCoverSuccess && isRecordsSuccess;

  useEffect(() => {
    if (setInitialRecordsWhenInEditMode && mode === REGISTRATION_MODES.EDIT && isSuccess) {
      const initialRecords = {
        contenthash: fetchedContenthash,
        ...fetchedRecords,
        ...fetchedCoinAddresses,
      } as Records;
      dispatch(ensRedux.setInitialRecords(initialRecords));
    }
  }, [dispatch, mode, fetchedCoinAddresses, fetchedRecords, isSuccess, setInitialRecordsWhenInEditMode, fetchedContenthash]);

  // Derive the records that should be added or removed from the profile
  // (these should be used for SET_TEXT txns instead of `records` to save
  // gas).
  const changedRecords = useMemo(() => {
    const initialRecordsWithDeprecated = Object.entries(deprecatedTextRecordFields).reduce((records, [deprecatedKey, key]) => {
      return {
        ...records,
        // @ts-expect-error – This is a key in ENS_RECORDS...
        [key]: initialRecords[deprecatedKey],
      };
    }, initialRecords);

    const entriesToChange = differenceWith(Object.entries(records), Object.entries(initialRecordsWithDeprecated), isEqual) as [
      keyof Records,
      string,
    ][];

    const changedRecords = entriesToChange.reduce(
      (recordsToAdd: Partial<Records>, [key, value]) => ({
        ...recordsToAdd,
        ...(value ? { [key]: value } : {}),
      }),
      {}
    );

    const recordKeysWithValue = (Object.keys(records) as (keyof Records)[]).filter((key: keyof Records) => {
      return Boolean(records[key]);
    });

    const keysToRemove = differenceWith(Object.keys(initialRecords), recordKeysWithValue, isEqual) as (keyof Records)[];

    const removedRecords = keysToRemove.reduce(
      (recordsToAdd: Partial<Records>, key) => ({
        ...recordsToAdd,
        [key]: '',
      }),
      {}
    );

    return {
      ...changedRecords,
      ...removedRecords,
    };
  }, [initialRecords, records]);

  const prevChangedRecords = usePrevious(changedRecords);
  useEffect(() => {
    if (modifyChangedRecords && JSON.stringify(prevChangedRecords || {}) !== JSON.stringify(changedRecords)) {
      dispatch(ensRedux.setChangedRecords(changedRecords));
    }
  }, [changedRecords, dispatch, modifyChangedRecords, prevChangedRecords]);

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
    isSuccess,
  };
}
