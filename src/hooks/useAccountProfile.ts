import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { EthereumAddress } from '@/entities';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import { AppState } from '@/redux/store';

const walletSelector = (state: AppState) => ({
  selectedWallet: state.wallets.selected || {},
  walletNames: state.wallets.walletNames,
});
const settingsSelector = (state: AppState) => ({
  accountAddress: state.settings.accountAddress,
});

const buildAccountProfile = (
  wallet: {
    selectedWallet: any;
    walletNames: { [a: EthereumAddress]: string };
  },
  account: { accountAddress: string }
) => {
  return getAccountProfileInfo(
    wallet.selectedWallet,
    wallet.walletNames,
    account.accountAddress
  );
};

export default function useAccountProfile() {
  const accountProfileSelector = createSelector(
    [walletSelector, settingsSelector],
    buildAccountProfile
  );

  const {
    accountAddress,
    accountColor,
    accountENS,
    accountImage,
    accountName,
    accountSymbol,
  } = useSelector(accountProfileSelector);

  return {
    accountAddress,
    accountColor,
    accountENS,
    accountImage,
    accountName,
    accountSymbol,
  };
}
