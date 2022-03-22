import { useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import useENSProfile from './useENSProfile';
import useWallets from './useWallets';
import { PROFILES, useExperimentalFlag } from '@rainbow-me/config';
import { getAccountProfileInfo } from '@rainbow-me/helpers/accountInfo';

export default function useAccountProfile() {
  const wallets = useWallets();
  const { selectedWallet, walletNames } = wallets;
  const {
    accountAddress: accountsettingsAddress,
    network,
  } = useAccountSettings();

  const {
    accountAddress,
    accountColor,
    accountENS,
    accountImage,
    accountName,
    accountSymbol,
  } = getAccountProfileInfo(
    selectedWallet,
    walletNames,
    network,
    accountsettingsAddress
  );

  const profilesEnabled = useExperimentalFlag(PROFILES);
  const ensProfile = useENSProfile(accountName, {
    enabled: Boolean(profilesEnabled && accountName),
  });

  return useMemo(
    () => ({
      accountAddress,
      accountColor,
      accountENS,
      accountImage: ensProfile?.data?.images?.avatarUrl ?? accountImage,
      accountName,
      accountSymbol,
    }),
    [
      accountAddress,
      accountColor,
      accountENS,
      ensProfile?.data?.images?.avatarUrl,
      accountImage,
      accountName,
      accountSymbol,
    ]
  );
}
