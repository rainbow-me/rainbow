import { useCallback, useMemo } from 'react';

import { REGISTRATION_MODES } from '@/features/ens/types/registration';
import { time } from '@/framework/core/utils/time';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountAddress } from '@/state/wallets/walletsStore';

import { findRecordNft, parseNftRecord } from '../core/nftRecord';
import { isDirectImagePath } from '../core/records';
import { useEnsRegistrationStore } from '../data/stores/registrationStore';
import { useENSRegistration } from './useENSRegistration';

export function useENSPendingRegistrations() {
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
    const registrationImages: Record<string, string | undefined> = {};
    for (const registration of pendingRegistrations) {
      const avatar = registration.records?.avatar;
      if (!avatar) continue;
      const nft = findRecordNft(uniqueTokens, parseNftRecord(avatar));
      const preview = avatar.startsWith('http://') || avatar.startsWith('https://') || isDirectImagePath(avatar) ? avatar : undefined;
      registrationImages[registration.name] = nft?.images.highResUrl || nft?.images.lowResUrl || preview;
    }
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
    finishRegistration,
    pendingRegistrations,
    registrationImages,
    removeExpiredRegistrations,
    removeRegistrationByName,
  };
}
