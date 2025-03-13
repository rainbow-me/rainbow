import { useEffect } from 'react';
import walletTypes from '@/helpers/walletTypes';
import { useWallets } from '@/hooks';
import { analyticsV2 } from '@/analytics';

export const useWalletCohort = () => {
  const { wallets } = useWallets();

  useEffect(() => {
    if (!wallets) return;

    const identify = Object.values(wallets).reduce(
      (result, wallet) => {
        switch (wallet.type) {
          case walletTypes.mnemonic:
            result.ownedAccounts += wallet.addresses.length;
            result.recoveryPhrases += 1;
            if (wallet.imported) {
              result.importedRecoveryPhrases += 1;
              result.hasImported = true;
            }
            break;
          case walletTypes.privateKey:
            result.ownedAccounts += wallet.addresses.length;
            result.privateKeys += 1;
            if (wallet.imported) {
              result.importedPrivateKeys += 1;
              result.hasImported = true;
            }
            break;
          case walletTypes.readOnly:
            result.watchedAccounts += wallet.addresses.length;
            break;
          case walletTypes.bluetooth:
            result.hardwareAccounts += wallet.addresses.length;
            result.ledgerDevices += 1;
            break;
        }
        return result;
      },
      {
        ownedAccounts: 0,
        watchedAccounts: 0,
        recoveryPhrases: 0,
        importedRecoveryPhrases: 0,
        privateKeys: 0,
        importedPrivateKeys: 0,
        hasImported: false,
        hardwareAccounts: 0,
        ledgerDevices: 0,
        trezorDevices: 0,
      }
    );

    analyticsV2.identify({
      ownedAccounts: identify.ownedAccounts,
      hardwareAccounts: identify.hardwareAccounts,
      watchedAccounts: identify.watchedAccounts,
      recoveryPhrases: identify.recoveryPhrases,
      importedRecoveryPhrases: identify.importedRecoveryPhrases,
      privateKeys: identify.privateKeys,
      importedPrivateKeys: identify.importedPrivateKeys,
      ledgerDevices: identify.ledgerDevices,
      trezorDevices: identify.trezorDevices,
      hasImported: identify.hasImported,
    });
  }, [wallets]);
};
