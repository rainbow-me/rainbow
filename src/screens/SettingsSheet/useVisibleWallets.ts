import { useState } from 'react';

import WalletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import { RainbowAccount, RainbowWallet } from '@/model/wallet';

type WalletByKey = {
  [key: string]: RainbowWallet;
};

type UseVisibleWalletProps = {
  wallets: WalletByKey | null;
  walletTypeCount: WalletCountPerType;
};

export type WalletCountPerType = {
  phrase: number;
  privateKey: number;
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

export const getTitleForWalletType = (type: EthereumWalletType, walletTypeCount: WalletCountPerType) => {
  switch (type) {
    case EthereumWalletType.mnemonic:
      return walletTypeCount.phrase > 0 ? `Wallet Group ${walletTypeCount.phrase}` : 'Wallet Group';
    case EthereumWalletType.privateKey:
      return walletTypeCount.privateKey > 0 ? `Private Key ${walletTypeCount.privateKey}` : 'Private Key';
    default:
      return '';
  }
};

export const useVisibleWallets = ({ wallets, walletTypeCount }: UseVisibleWalletProps): UseVisibleWalletReturnType => {
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

        if (wallet.backedUp && wallet.backupDate && (!lastBackupDate || Number(wallet.backupDate) > lastBackupDate)) {
          setLastBackupDate(Number(wallet.backupDate));
        }

        if (wallet.type === WalletTypes.mnemonic) {
          walletTypeCount.phrase += 1;
        } else if (wallet.type === WalletTypes.privateKey) {
          walletTypeCount.privateKey += 1;
        }

        return {
          ...wallet,
          name: getTitleForWalletType(wallet.type, walletTypeCount),
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
