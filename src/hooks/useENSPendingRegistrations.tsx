import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAccountSettings, useENSRegistration } from '.';
import { ENSRegistrationState } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';
import { isENSNFTAvatar, parseENSNFTAvatar } from '@rainbow-me/utils';

export default function useENSPendingRegistrations() {
  const { accountAddress } = useAccountSettings();
  const { removeRegistrationByName } = useENSRegistration();

  const { pendingRegistrations, accountRegistrations } = useSelector(
    ({ ensRegistration }: AppState) => {
      const { registrations } = ensRegistration as ENSRegistrationState;
      const accountRegistrations =
        registrations?.[accountAddress.toLowerCase()];
      const registrationsArray = Object.values(accountRegistrations);

      const pendingRegistrations = registrationsArray
        .filter(
          registration =>
            !registration?.registerTransactionHash &&
            registration?.commitTransactionHash
        )
        .sort(
          (a, b) =>
            (a?.commitTransactionConfirmedAt || 0) -
            (b?.commitTransactionConfirmedAt || 0)
        );

      return { accountRegistrations, pendingRegistrations };
    }
  );

  const uniqueTokens = useSelector(
    ({ uniqueTokens }: AppState) => uniqueTokens.uniqueTokens
  );
  const registrationImages = useMemo(() => {
    const registrationImagesArray = pendingRegistrations.map(
      ({ name, records }) => {
        let avatarUrl;
        if (records?.avatar) {
          const isNFTAvatar = isENSNFTAvatar(records.avatar);
          if (isNFTAvatar) {
            const { contractAddress, tokenId } = parseENSNFTAvatar(
              records?.avatar
            );
            const uniqueToken = uniqueTokens.find(
              token =>
                token.asset_contract.address === contractAddress &&
                token.id === tokenId
            );
            if (uniqueToken?.image_thumbnail_url) {
              avatarUrl = uniqueToken?.image_thumbnail_url;
            }
          } else if (
            records.avatar.startsWith('http') ||
            (records.avatar.startsWith('/') &&
              !records.avatar.match(/^\/(ipfs|ipns)/))
          ) {
            avatarUrl = records.avatar;
          }
        }
        return {
          avatarUrl,
          name,
        };
      }
    );
    const registrationImages: { [name: string]: string | undefined } = {};
    registrationImagesArray.forEach(
      ({ name, avatarUrl }) => (registrationImages[name] = avatarUrl)
    );
    return registrationImages;
  }, [pendingRegistrations, uniqueTokens]);

  const removeRegistration = useCallback(
    name => removeRegistrationByName(name),
    [removeRegistrationByName]
  );

  return {
    accountRegistrations,
    pendingRegistrations,
    registrationImages,
    removeRegistrationByName: removeRegistration,
  };
}
