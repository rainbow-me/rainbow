import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings } from '.';
import { ENSRegistrationState, Records } from '@rainbow-me/entities';
import {
  removeRecordByKey,
  updateRecordByKey,
  updateRecords,
} from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';
import { isENSNFTAvatar, parseENSNFTAvatar } from '@rainbow-me/utils';

export default function useENSProfile() {
  const { accountAddress } = useAccountSettings();
  const { records, name, registrationParameters } = useSelector(
    ({ ensRegistration }: AppState) => {
      const {
        currentRegistrationName,
        registrations,
      } = ensRegistration as ENSRegistrationState;
      const registrationParameters =
        registrations?.[accountAddress?.toLowerCase()]?.[
          currentRegistrationName
        ] || {};
      const records = registrationParameters?.records || {};
      return { name: currentRegistrationName, records, registrationParameters };
    }
  );
  const dispatch = useDispatch();

  // Since `records.avatar` is not a reliable source for an avatar URL
  // (the avatar can be an NFT), then if the avatar is an NFT, we will
  // parse it to obtain the URL.
  const uniqueTokens = useSelector(
    ({ uniqueTokens }: AppState) => uniqueTokens.uniqueTokens
  );
  const avatarUrl = useMemo(() => {
    if (records.avatar) {
      const isNFTAvatar = isENSNFTAvatar(records.avatar);
      if (isNFTAvatar) {
        const { contractAddress, tokenId } = parseENSNFTAvatar(records.avatar);
        const uniqueToken = uniqueTokens.find(
          token =>
            token.asset_contract.address === contractAddress &&
            token.id === tokenId
        );
        return uniqueToken?.image_thumbnail_url;
      }
    }
    return records.avatar;
  }, [records.avatar, uniqueTokens]);

  return {
    avatarUrl,
    name,
    records,
    registrationParameters,
    removeRecordByKey: (key: string) =>
      dispatch(removeRecordByKey(accountAddress, key)),
    updateRecordByKey: (key: string, value: string) =>
      dispatch(updateRecordByKey(accountAddress, key, value)),
    updateRecords: (records: Records) =>
      dispatch(updateRecords(accountAddress, records)),
  };
}
