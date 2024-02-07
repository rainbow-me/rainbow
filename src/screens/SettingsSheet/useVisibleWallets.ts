import { useState } from 'react';

import WalletTypes from '@/helpers/walletTypes';
import { RainbowWallet } from '@/model/wallet';

type WalletByKey = {
  [key: string]: RainbowWallet;
};

type UseVisibleWalletProps = {
  wallets: WalletByKey | null;
};

type AmendedRainbowWallet = RainbowWallet & {
  name: string;
  isBackedUp: boolean | undefined;
  accounts: any[];
  key: string;
  label: string;
  numAccounts: number;
};

type UseVisibleWalletReturnType = {
  visibleWallets: AmendedRainbowWallet[];
  lastBackupDate: number | undefined;
};

export const useVisibleWallets = ({ wallets }: UseVisibleWalletProps): UseVisibleWalletReturnType => {
  const [sumPrivateKeyWallets, setSumPrivateKeyWallets] = useState(0);
  const [sumSecretPhraseWallets, setSumSecretPhraseWallets] = useState(0);
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

        let name = '';
        if (wallet.type === WalletTypes.privateKey) {
          if (sumPrivateKeyWallets > 0) {
            setSumPrivateKeyWallets(prev => {
              name = `Private Key ${prev}`;
              return prev + 1;
            });
          } else {
            name = 'Private Key';
          }
        }

        if (wallet.type === WalletTypes.mnemonic || wallet.type === WalletTypes.seed) {
          if (sumSecretPhraseWallets > 1) {
            setSumSecretPhraseWallets(prev => {
              name = `Secret Phrease ${prev}`;
              return prev + 1;
            });
          } else {
            name = 'Secret Phrase';
          }
        }

        return {
          ...wallet,
          name,
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
