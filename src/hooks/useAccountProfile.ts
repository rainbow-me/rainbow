import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { EthereumAddress } from '@/entities';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import { AppState } from '@/redux/store';
import { RainbowWallet } from '@/model/wallet';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';

const walletSelector = (state: AppState) => ({
  wallets: state.wallets.wallets,
  selectedWallet: state.wallets.selected || ({} as RainbowWallet),
  walletNames: state.wallets.walletNames,
});
const settingsSelector = (state: AppState) => ({
  accountAddress: state.settings.accountAddress,
});

const buildAccountProfile = (
  wallet: {
    wallets: { [id: string]: RainbowWallet } | null;
    selectedWallet: RainbowWallet;
    walletNames: { [a: EthereumAddress]: string };
  },
  account: { accountAddress: string }
) => {
  const selectedWallet = findWalletWithAccount(wallet.wallets || {}, account.accountAddress);
  return getAccountProfileInfo(selectedWallet || wallet.selectedWallet, wallet.walletNames, account.accountAddress);
};

const accountProfileSelector = createSelector([walletSelector, settingsSelector], buildAccountProfile);

export default function useAccountProfile() {
  const { accountAddress, accountColor, accountENS, accountImage, accountName, accountSymbol } = useSelector(accountProfileSelector);

  return {
    accountAddress,
    accountColor,
    accountENS,
    accountImage,
    accountName,
    accountSymbol,
  };
}
