import { differenceWith, isEqual } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings, useENSProfile } from '.';
import { Records } from '@rainbow-me/entities';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import * as ensRedux from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';
import { isENSNFTRecord, parseENSNFTRecord } from '@rainbow-me/utils';
import getENSNFTAvatarUrl from '@rainbow-me/utils/getENSNFTAvatarUrl';

export default function useENSRegistration({
  setInitialRecordsWhenInEditMode = false,
}: {
  /** When true, an update to `initialRecords` will be triggered when the flow is in "edit mode". */
  setInitialRecordsWhenInEditMode?: boolean;
} = {}) {
  const { accountAddress } = useAccountSettings();

  const registrationParameters = useSelector(
    ({ ensRegistration }: AppState) => {
      return {
        ...ensRegistration.registrations?.[accountAddress?.toLowerCase()]?.[
          ensRegistration.currentRegistrationName
        ],
        currentRegistrationName: ensRegistration.currentRegistrationName,
      };
    }
  );

  const { mode, name, initialRecords, records } = useMemo(
    () => ({
      initialRecords: registrationParameters.initialRecords || {},
      mode: registrationParameters.mode,
      name: registrationParameters.currentRegistrationName,
      records: registrationParameters.records || {},
    }),
    [
      registrationParameters.initialRecords,
      registrationParameters.mode,
      registrationParameters.currentRegistrationName,
      registrationParameters.records,
    ]
  );

  const dispatch = useDispatch();
  const removeRecordByKey = useCallback(
    (key: string) => dispatch(ensRedux.removeRecordByKey(accountAddress, key)),
    [accountAddress, dispatch]
  );
  const startRegistration = useCallback(
    (name: string, mode: keyof typeof REGISTRATION_MODES) =>
      dispatch(ensRedux.startRegistration(accountAddress, name, mode)),
    [accountAddress, dispatch]
  );
  const updateRecordByKey = useCallback(
    (key: string, value: string) =>
      dispatch(ensRedux.updateRecordByKey(accountAddress, key, value)),
    [accountAddress, dispatch]
  );
  const updateRecords = useCallback(
    (records: Records) =>
      dispatch(ensRedux.updateRecords(accountAddress, records)),
    [accountAddress, dispatch]
  );
  const clearCurrentRegistrationName = useCallback(
    () => dispatch(ensRedux.clearCurrentRegistrationName()),
    [dispatch]
  );

  const removeRegistrationByName = useCallback(
    (name: string) =>
      dispatch(ensRedux.removeRegistrationByName(accountAddress, name)),
    [accountAddress, dispatch]
  );

  const profileQuery = useENSProfile(name, {
    enabled: mode === REGISTRATION_MODES.EDIT,
  });
  useEffect(() => {
    if (
      setInitialRecordsWhenInEditMode &&
      mode === REGISTRATION_MODES.EDIT &&
      profileQuery.isSuccess
    ) {
      dispatch(
        ensRedux.setInitialRecords(accountAddress, {
          ...profileQuery.data?.records,
          ...profileQuery.data?.coinAddresses,
        } as Records)
      );
    }
  }, [
    accountAddress,
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

  useEffect(() => {
    dispatch(ensRedux.setChangedRecords(accountAddress, changedRecords));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountAddress, JSON.stringify(changedRecords), dispatch]);

  // Since `records.avatar` is not a reliable source for an avatar URL
  // (the avatar can be an NFT), then if the avatar is an NFT, we will
  // parse it to obtain the URL.
  const uniqueTokens = useSelector(
    ({ uniqueTokens }: AppState) => uniqueTokens.uniqueTokens
  );
  const images = useMemo(() => {
    const getImageUrl = (
      key: 'avatar' | 'cover',
      defaultValue?: string | null
    ) => {
      const recordValue = records?.[key];
      let imageUrl =
        getENSNFTAvatarUrl(uniqueTokens, records?.[key]) || defaultValue;

      if (changedRecords[key] === '') {
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

    const avatarUrl = getImageUrl(
      'avatar',
      profileQuery.data?.images.avatarUrl
    );
    const coverUrl = getImageUrl('cover', profileQuery.data?.images.coverUrl);

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
  ]);

  return {
    changedRecords,
    clearCurrentRegistrationName,
    images,
    initialRecords,
    mode,
    name,
    profileQuery,
    records,
    registrationParameters,
    removeRecordByKey,
    removeRegistrationByName,
    startRegistration,
    updateRecordByKey,
    updateRecords,
  };
}
