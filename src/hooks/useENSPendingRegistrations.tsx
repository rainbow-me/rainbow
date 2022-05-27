import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings, useENSRegistration } from '.';
import { ENSRegistrationState } from '@rainbow-me/entities';
import { removeExpiredRegistrations } from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';
import { getENSNFTAvatarUrl } from '@rainbow-me/utils';

export default function useENSPendingRegistrations() {
  const { accountAddress } = useAccountSettings();
  const { removeRegistrationByName } = useENSRegistration();
  const dispatch = useDispatch();

  const { pendingRegistrations, accountRegistrations } = useSelector(
    ({ ensRegistration }: AppState) => {
      const { registrations } = ensRegistration as ENSRegistrationState;
      const accountRegistrations =
        registrations?.[accountAddress.toLowerCase()] || [];
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
    const registrationImagesArray = pendingRegistrations?.map(
      ({ name, records }) => {
        const avatarUrl = getENSNFTAvatarUrl(uniqueTokens, records?.avatar);
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

  const refreshRegistrations = useCallback(() => {
    dispatch(removeExpiredRegistrations());
  }, [dispatch]);

  return {
    accountRegistrations,
    pendingRegistrations,
    registrationImages,
    removeExpiredRegistrations: refreshRegistrations,
    removeRegistrationByName: removeRegistration,
  };
}
