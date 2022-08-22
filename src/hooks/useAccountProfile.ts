import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { EthereumAddress } from '@/entities';
import { getAccountProfileInfo } from '@rainbow-me/helpers/accountInfo';

const walletSelector = createSelector(
  ({ wallets: { selected = {}, walletNames } }) => ({
    selectedWallet: selected as any,
    walletNames,
  }),
  ({ selectedWallet, walletNames }) => ({
    selectedWallet,
    walletNames,
  })
);

const settingsSelector = createSelector(
  ({ settings: { accountAddress } }) => ({
    accountAddress,
  }),
  ({ accountAddress }) => ({
    accountAddress,
  })
);

const buildAccountProfile = (
  wallet: {
    selectedWallet: any;
    walletNames: { [a: EthereumAddress]: string };
  },
  account: { accountAddress: string }
) =>
  getAccountProfileInfo(
    wallet.selectedWallet,
    wallet.walletNames,
    account.accountAddress
  );

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
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'OutputParametricSelector<{ walle... Remove this comment to see the full error message
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
