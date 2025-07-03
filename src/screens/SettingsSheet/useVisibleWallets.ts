import { useMemo } from 'react';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import WalletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { RainbowWallet } from '@/model/wallet';

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

export const getTitleForWalletType = ({
  name,
  type,
  walletTypeCount,
}: {
  name: string;
  type: EthereumWalletType;
  walletTypeCount: WalletCountPerType;
}) => {
  switch (type) {
    case EthereumWalletType.mnemonic: {
      const trimmedName = removeFirstEmojiFromString(name).trim();
      const customWalletGroupName = trimmedName ? trimmedName : undefined;

      return (
        customWalletGroupName ??
        (walletTypeCount.phrase > 0
          ? i18n.t(i18n.l.back_up.wallet_group_title_plural, { walletGroupNumber: walletTypeCount.phrase })
          : i18n.t(i18n.l.back_up.wallet_group_title_singular))
      );
    }
    case EthereumWalletType.privateKey:
      return walletTypeCount.privateKey > 0
        ? i18n.t(i18n.l.back_up.private_key_plural, { privateKeyNumber: walletTypeCount.privateKey })
        : i18n.t(i18n.l.back_up.private_key_singluar);
    default:
      return '';
  }
};

export const useVisibleWallets = ({ wallets, walletTypeCount }: UseVisibleWalletProps): RainbowWallet[] => {
  return useMemo(() => {
    walletTypeCount.phrase = 0;
    walletTypeCount.privateKey = 0;

    if (!wallets) return [];

    return Object.keys(wallets)
      .filter(key => wallets[key].type !== WalletTypes.readOnly && wallets[key].type !== WalletTypes.bluetooth)
      .map(key => {
        const wallet = wallets[key];

        if (wallet.type === WalletTypes.mnemonic) {
          walletTypeCount.phrase += 1;
        } else if (wallet.type === WalletTypes.privateKey) {
          walletTypeCount.privateKey += 1;
        }

        return {
          ...wallet,
          name: getTitleForWalletType({ name: wallet.name, type: wallet.type, walletTypeCount }),
          addresses: Object.values(wallet.addresses).filter(address => address.visible),
        };
      });
  }, [wallets, walletTypeCount]);
};
