import GraphemeSplitter from 'grapheme-splitter';
import { get, toUpper } from 'lodash';
import { removeFirstEmojiFromString } from '../helpers/emojiHandler';
import { address } from '../utils/abbreviations';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';

export default function useAccountProfile() {
  const wallets = useWallets();
  const { selectedWallet, walletNames } = wallets;

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

  const accountName = removeFirstEmojiFromString(
    label || accountENS || address(accountAddress, 6, 4)
  ).join('');

  const labelOrAccountName =
    accountName === label ? toUpper(accountName) : label;
  const accountSymbol = new GraphemeSplitter().splitGraphemes(
    labelOrAccountName || toUpper(accountENS) || `${index + 1}`
  )[0];
  const accountColor = color;

  return {
    accountAddress,
    accountColor,
    accountENS,
    accountName,
    accountSymbol,
  };
}
