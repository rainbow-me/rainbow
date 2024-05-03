import { useState } from 'react';
import * as i18n from '@/languages';

import WalletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import { DEFAULT_WALLET_NAME, RainbowAccount, RainbowWallet } from '@/model/wallet';
import walletBackupTypes from '@/helpers/walletBackupTypes';

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

export type AmendedRainbowWallet = RainbowWallet & {
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
      return walletTypeCount.phrase > 0
        ? i18n.t(i18n.l.back_up.wallet_group_title_plural, { walletGroupNumber: walletTypeCount.phrase })
        : i18n.t(i18n.l.back_up.wallet_group_title_singular);
    case EthereumWalletType.privateKey:
      return walletTypeCount.privateKey > 0
        ? i18n.t(i18n.l.back_up.private_key_plural, { privateKeyNumber: walletTypeCount.privateKey })
        : i18n.t(i18n.l.back_up.private_key_singluar);
    default:
      return '';
  }
};

const isWalletGroupNamed = (wallet: RainbowWallet) => wallet.name && wallet.name.trim() !== '' && wallet.name !== DEFAULT_WALLET_NAME;

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

        if (
          wallet.backedUp &&
          wallet.backupDate &&
          wallet.backupType === walletBackupTypes.cloud &&
          (!lastBackupDate || Number(wallet.backupDate) > lastBackupDate)
        ) {
          setLastBackupDate(Number(wallet.backupDate));
        }

        if (wallet.type === WalletTypes.mnemonic) {
          walletTypeCount.phrase += 1;
        } else if (wallet.type === WalletTypes.privateKey) {
          walletTypeCount.privateKey += 1;
        }

        return {
          ...wallet,
          name: isWalletGroupNamed(wallet) ? wallet.name : getTitleForWalletType(wallet.type, walletTypeCount),
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
