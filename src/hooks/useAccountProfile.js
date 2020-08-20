import GraphemeSplitter from 'grapheme-splitter';
import { get, toUpper } from 'lodash';
import { removeFirstEmojiFromString } from '../helpers/emojiHandler';
import networkTypes from '../helpers/networkTypes';
import { address } from '../utils/abbreviations';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';

export default function useAccountProfile() {
  const wallets = useWallets();
  const { selectedWallet, walletNames } = wallets;

  const { network } = useAccountSettings();
  const settings = useAccountSettings();
  const { accountAddress } = settings;

  if (!selectedWallet) {
    return {};
  }

  if (!accountAddress) {
    return {};
  }

  if (!selectedWallet?.addresses?.length) {
    return {};
  }

  const accountENS = get(walletNames, `${accountAddress}`);

  const selectedAccount = selectedWallet.addresses.find(
    account => account.address === accountAddress
  );

  if (!selectedAccount) {
    return {};
  }

  const { label, color, index } = selectedAccount;
  const accountColor = color;

  const accountName = removeFirstEmojiFromString(
    network === networkTypes.mainnet
      ? label || accountENS || address(accountAddress, 6, 4)
      : label === accountENS
      ? address(accountAddress, 6, 4)
      : label || address(accountAddress, 6, 4)
  ).join('');

  const labelOrAccountName =
    accountName === label ? toUpper(accountName) : label;
  const accountSymbol = new GraphemeSplitter().splitGraphemes(
    network === networkTypes.mainnet
      ? labelOrAccountName || toUpper(accountENS) || `${index + 1}`
      : label === accountENS
      ? toUpper(accountName)
      : toUpper(label) || toUpper(accountName)
  )[0];

  return {
    accountAddress,
    accountColor,
    accountENS,
    accountName,
    accountSymbol,
  };
}
