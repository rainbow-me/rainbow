import { createBaseStore, useListen } from '@storesjs/stores';
import isEmpty from 'lodash/isEmpty';

import { analytics } from '@/analytics';
import { time } from '@/framework/core/utils/time';
import walletTypes from '@/helpers/walletTypes';
import { useWalletsStore, type WalletsState } from '@/state/wallets/walletsStore';

const useLastTrackedAtStore = createBaseStore(() => 0, {
  storageKey: 'walletCohortTracker',
});

export function useWalletCohort(): void {
  useListen(useWalletsStore, state => state.wallets, identifyWalletCohort);
}

function identifyWalletCohort(wallets: WalletsState['wallets']): void {
  if (!wallets || isEmpty(wallets)) return;

  const now = Date.now();
  const lastTracked = useLastTrackedAtStore.getState();

  if (now - lastTracked < time.days(1)) return;
  useLastTrackedAtStore.setState(now);

  requestIdleCallback(() => {
    const identify = Object.values(wallets).reduce(
      (result, wallet) => {
        const addresses = wallet.addresses;
        if (!addresses) return result;

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
        hardwareAccounts: 0,
        hasImported: false,
        importedPrivateKeys: 0,
        importedRecoveryPhrases: 0,
        ledgerDevices: 0,
        ownedAccounts: 0,
        privateKeys: 0,
        recoveryPhrases: 0,
        trezorDevices: 0,
        watchedAccounts: 0,
      }
    );

    analytics.identify({
      hardwareAccounts: identify.hardwareAccounts,
      hasImported: identify.hasImported,
      importedPrivateKeys: identify.importedPrivateKeys,
      importedRecoveryPhrases: identify.importedRecoveryPhrases,
      ledgerDevices: identify.ledgerDevices,
      ownedAccounts: identify.ownedAccounts,
      privateKeys: identify.privateKeys,
      recoveryPhrases: identify.recoveryPhrases,
      trezorDevices: identify.trezorDevices,
      watchedAccounts: identify.watchedAccounts,
    });
  });
}
