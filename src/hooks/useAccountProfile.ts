import { EthereumAddress } from '@/entities';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { RainbowWallet } from '@/model/wallet';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useWalletsStore } from '../redux/wallets';

const buildAccountProfile = (props: {
  wallets: { [id: string]: RainbowWallet } | null;
  selectedWallet: RainbowWallet;
  walletNames: { [a: EthereumAddress]: string };
  accountAddress: string;
}) => {
  const selectedWallet = findWalletWithAccount(props.wallets || {}, props.accountAddress);
  return getAccountProfileInfo(selectedWallet || props.selectedWallet, props.walletNames, props.accountAddress);
};

const accountProfileSelector = createSelector([walletSelector, settingsSelector], buildAccountProfile);

export default function useAccountProfile() {
  const { accountColor, accountENS, accountImage, accountName, accountSymbol } = useSelector(accountProfileSelector);
  const accountAddress = useWalletsStore(state => state.accountAddress);

  return {
    accountAddress,
    accountColor,
    accountENS,
    accountImage,
    accountName,
    accountSymbol,
  };
}
