import { useEffect, useRef } from 'react';
import walletTypes from '@/helpers/walletTypes';
import { useWallets } from '@/hooks';
import { analytics } from '@/analytics';
import { isEmpty } from 'lodash';
import { InteractionManager } from 'react-native';

export const useWalletCohort = () => {
  const { wallets } = useWallets();
  const alreadyIdentified = useRef(false);

  useEffect(() => {
    if (alreadyIdentified.current || !wallets || isEmpty(wallets)) return;
    alreadyIdentified.current = true;

    requestIdleCallback(() => {
      InteractionManager.runAfterInteractions(() => {
        const identify = Object.values(wallets).reduce(
          (result, wallet) => {
            const addresses = wallet.addresses || [];
            switch (wallet.type) {
              case walletTypes.mnemonic:
                result.ownedAccounts += addresses.length;
                result.recoveryPhrases += 1;
                if (wallet.imported) {
                  result.importedRecoveryPhrases += 1;
                  result.hasImported = true;
                }
                break;
              case walletTypes.privateKey:
                result.ownedAccounts += addresses.length;
                result.privateKeys += 1;
                if (wallet.imported) {
                  result.importedPrivateKeys += 1;
                  result.hasImported = true;
                }
                break;
              case walletTypes.readOnly:
                result.watchedAccounts += addresses.length;
                break;
              case walletTypes.bluetooth:
                result.hardwareAccounts += addresses.length;
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

        analytics.identify({
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
      });
    });
  }, [wallets]);
};
