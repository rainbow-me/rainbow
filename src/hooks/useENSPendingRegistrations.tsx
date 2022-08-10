import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings, useENSRegistration } from '.';
import { ENSRegistrationState } from '@rainbow-me/entities';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import { useNavigation } from '@rainbow-me/navigation';
import { removeExpiredRegistrations } from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';
import Routes from '@rainbow-me/routes';
import { getENSNFTAvatarUrl } from '@rainbow-me/utils';

export default function useENSPendingRegistrations() {
  const { accountAddress } = useAccountSettings();
  const { removeRegistrationByName, startRegistration } = useENSRegistration();
  const { navigate } = useNavigation();
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

  const finishRegistration = useCallback(
    name => {
      startRegistration(name, REGISTRATION_MODES.CREATE);
      setTimeout(() => {
        navigate(Routes.ENS_CONFIRM_REGISTER_SHEET, {});
      }, 100);
    },
    [navigate, startRegistration]
  );

  return {
    accountRegistrations,
    finishRegistration,
    pendingRegistrations,
    registrationImages,
    removeExpiredRegistrations: refreshRegistrations,
    removeRegistrationByName: removeRegistration,
  };
}
