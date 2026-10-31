import { useCallback, useMemo } from 'react';

import { time } from '@/framework/core/utils/time';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountAddress } from '@/state/wallets/walletsStore';

import { useEnsRegistrationStore } from '../data/stores/registrationStore';
import { REGISTRATION_MODES } from '../utils/helpers';
import { getENSNFTAvatarUrl } from '../utils/records';
import { useENSRegistration } from './useENSRegistration';

export default function useENSPendingRegistrations() {
  const accountAddress = useAccountAddress();
  const { removeRegistrationByName, startRegistration } = useENSRegistration();
  const { navigate } = useNavigation();
  const accountRegistrations = useEnsRegistrationStore(s => s.registrations[accountAddress.toLowerCase()]);
  const pendingRegistrations = useMemo(
    () =>
      Object.values(accountRegistrations ?? {})
        .filter(registration => !registration.registerTransactionHash && registration.commitTransactionHash)
        .sort((a, b) => (a.commitTransactionConfirmedAt ?? 0) - (b.commitTransactionConfirmedAt ?? 0)),
    [accountRegistrations]
  );

  const {
    data: { nfts: uniqueTokens },
  } = useLegacyNFTs({
    address: accountAddress,
  });
  const registrationImages = useMemo(() => {
    const registrationImagesArray = pendingRegistrations?.map(({ name, records }) => {
      const avatarUrl = getENSNFTAvatarUrl(uniqueTokens, records?.avatar);
      return {
        avatarUrl,
        name,
      };
    });
    const registrationImages: { [name: string]: string | undefined } = {};
    registrationImagesArray.forEach(({ name, avatarUrl }) => (registrationImages[name] = avatarUrl));
    return registrationImages;
  }, [pendingRegistrations, uniqueTokens]);

  const removeExpiredRegistrations = useCallback(() => {
    useEnsRegistrationStore.getState().removeExpired(accountAddress);
  }, [accountAddress]);

  const finishRegistration = useCallback(
    (name: string) => {
      startRegistration(name, REGISTRATION_MODES.CREATE);
      setTimeout(() => {
        navigate(Routes.ENS_CONFIRM_REGISTER_SHEET, { name });
      }, time.ms(100));
    },
    [navigate, startRegistration]
  );

  return {
    accountRegistrations,
    finishRegistration,
    pendingRegistrations,
    registrationImages,
    removeExpiredRegistrations,
    removeRegistrationByName,
  };
}
