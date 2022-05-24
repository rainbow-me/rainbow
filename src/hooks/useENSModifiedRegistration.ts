import { differenceWith, isEqual } from 'lodash';
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useENSProfileRecords from './useENSProfileRecords';
import useENSRegistration from './useENSRegistration';
import { usePrevious } from '.';
import { Records, UniqueAsset } from '@rainbow-me/entities';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import * as ensRedux from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';
import {
  getENSNFTAvatarUrl,
  isENSNFTRecord,
  parseENSNFTRecord,
} from '@rainbow-me/utils';

const getImageUrl = (
  key: 'avatar' | 'cover',
  records: Records,
  changedRecords: Records,
  uniqueTokens: UniqueAsset[],
  defaultValue?: string | null,
  mode?: keyof typeof REGISTRATION_MODES
) => {
  const recordValue = records?.[key];
  let imageUrl =
    getENSNFTAvatarUrl(uniqueTokens, records?.[key]) || defaultValue;

  if (changedRecords[key] === '' && mode === REGISTRATION_MODES.EDIT) {
    // If the image has been removed, update accordingly.
    imageUrl = '';
  } else if (recordValue) {
    const isNFT = isENSNFTRecord(recordValue);
    if (isNFT) {
      const { contractAddress, tokenId } = parseENSNFTRecord(
        records?.[key] || ''
      );
      const uniqueToken = uniqueTokens.find(
        token =>
          token.asset_contract.address === contractAddress &&
          token.id === tokenId
      );
      if (uniqueToken?.image_url) {
        imageUrl = uniqueToken?.image_url;
      } else if (uniqueToken?.image_thumbnail_url) {
        imageUrl = uniqueToken?.image_thumbnail_url;
      }
    } else if (
      recordValue?.startsWith('http') ||
      recordValue?.startsWith('file') ||
      ((recordValue?.startsWith('/') || recordValue?.startsWith('~')) &&
        !recordValue?.match(/^\/(ipfs|ipns)/))
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

  const uniqueTokens = useSelector(
    ({ uniqueTokens }: AppState) => uniqueTokens.uniqueTokens
  );
  const profileQuery = useENSProfileRecords(name, {
    enabled:
      mode === REGISTRATION_MODES.EDIT ||
      mode === REGISTRATION_MODES.RENEW ||
      mode === REGISTRATION_MODES.SET_NAME,
  });

  useEffect(() => {
    if (
      setInitialRecordsWhenInEditMode &&
      mode === REGISTRATION_MODES.EDIT &&
      profileQuery.isSuccess
    ) {
      const initialRecords = {
        ...profileQuery.data?.records,
        ...profileQuery.data?.coinAddresses,
      } as Records;
      dispatch(ensRedux.setInitialRecords(initialRecords));
    }
  }, [
    dispatch,
    mode,
    profileQuery.data?.coinAddresses,
    profileQuery.data?.records,
    profileQuery.isSuccess,
    setInitialRecordsWhenInEditMode,
  ]);

  // Derive the records that should be added or removed from the profile
  // (these should be used for SET_TEXT txns instead of `records` to save
  // gas).
  const changedRecords = useMemo(() => {
    const entriesToChange = differenceWith(
      Object.entries(records),
      Object.entries(initialRecords),
      isEqual
    ) as [keyof Records, string][];

    const changedRecords = entriesToChange.reduce(
      (recordsToAdd: Partial<Records>, [key, value]) => ({
        ...recordsToAdd,
        ...(value ? { [key]: value } : {}),
      }),
      {}
    );

    const recordKeysWithValue = (Object.keys(
      records
    ) as (keyof Records)[]).filter((key: keyof Records) => {
      return Boolean(records[key]);
    });

    const keysToRemove = differenceWith(
      Object.keys(initialRecords),
      recordKeysWithValue,
      isEqual
    ) as (keyof Records)[];

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
    if (
      modifyChangedRecords &&
      JSON.stringify(prevChangedRecords || {}) !==
        JSON.stringify(changedRecords)
    ) {
      dispatch(ensRedux.setChangedRecords(changedRecords));
    }
  }, [changedRecords, dispatch, modifyChangedRecords, prevChangedRecords]);

  // Since `records.avatar` is not a reliable source for an avatar URL
  // (the avatar can be an NFT), then if the avatar is an NFT, we will
  // parse it to obtain the URL.
  const images = useMemo(() => {
    const avatarUrl = getImageUrl(
      'avatar',
      records,
      changedRecords,
      uniqueTokens,
      profileQuery.data?.images.avatarUrl,
      mode
    );
    const coverUrl = getImageUrl(
      'cover',
      records,
      changedRecords,
      uniqueTokens,
      profileQuery.data?.images.coverUrl,
      mode
    );

    return {
      avatarUrl,
      coverUrl,
    };
  }, [
    profileQuery.data?.images.avatarUrl,
    profileQuery.data?.images.coverUrl,
    records,
    uniqueTokens,
    changedRecords,
    mode,
  ]);

  return {
    changedRecords,
    images,
    profileQuery,
  };
}
