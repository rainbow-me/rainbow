import { useState } from 'react';

import WalletTypes from '@/helpers/walletTypes';
import { RainbowAccount, RainbowWallet } from '@/model/wallet';

type WalletByKey = {
  [key: string]: RainbowWallet;
};

type UseVisibleWalletProps = {
  wallets: WalletByKey | null;
};

type AmendedRainbowWallet = RainbowWallet & {
  name: string;
  isBackedUp: boolean | undefined;
  accounts: RainbowAccount[];
  key: string;
  label: string;
  numAccounts: number;
};

type UseVisibleWalletReturnType = {
  visibleWallets: AmendedRainbowWallet[];
  lastBackupDate: number | undefined;
};

export const useVisibleWallets = ({ wallets }: UseVisibleWalletProps): UseVisibleWalletReturnType => {
  const [lastBackupDate, setLastBackupDate] = useState<number | undefined>(undefined);

  if (!wallets) {
    return {
      visibleWallets: [],
      lastBackupDate,
    };
  }

  return {
    visibleWallets: Object.keys(wallets)
      .filter(key => wallets[key].type !== WalletTypes.readOnly && wallets[key].type !== WalletTypes.bluetooth)
      .map(key => {
        const wallet = wallets[key];
        const visibleAccounts = wallet.addresses.filter(a => a.visible);
        const totalAccounts = visibleAccounts.length;

        if (wallet.backedUp && wallet.backupDate && (!lastBackupDate || wallet.backupDate > lastBackupDate)) {
          setLastBackupDate(wallet.backupDate);
        }

        return {
          ...wallet,
          isBackedUp: wallet.backedUp,
          accounts: visibleAccounts,
          key,
          label: wallet.name,
          numAccounts: totalAccounts,
        };
      }),
    lastBackupDate,
  };
};
