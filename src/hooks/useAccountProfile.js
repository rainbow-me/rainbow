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
  const { accountAddress, network } = useAccountSettings();
  return getAccountProfileInfo(
    selectedWallet,
    walletNames,
    network,
    accountAddress
  );
}

export function getAccountProfileInfo(
  selectedWallet,
  walletNames,
  network,
  accountAddress
) {
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

  const { label, color, index, image } = selectedAccount;

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
  const accountColor = color;
  const accountImage = image;

  return {
    accountAddress,
    accountColor,
    accountENS,
    accountImage,
    accountName,
    accountSymbol,
  };
}
