import GraphemeSplitter from 'grapheme-splitter';
import { get, toUpper } from 'lodash';
import { removeFirstEmojiFromString } from '../helpers/emojiHandler';
import { address } from '../utils/abbreviations';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';

export default function useAccountProfile() {
  const { selectedWallet, walletNames } = useWallets();

  const { accountAddress } = useAccountSettings();

  if (!selectedWallet) return {};
  if (!accountAddress) return {};

  if (!selectedWallet || !selectedWallet?.addresses?.length) return {};

  const accountENS = get(walletNames, `${accountAddress}`);

  const selectedAccount = selectedWallet.addresses.find(
    account => account.address === accountAddress
  );

  if (!selectedAccount) return {};

  const { label, color, index, image } = selectedAccount;

  const accountName = removeFirstEmojiFromString(
    label || accountENS || address(accountAddress, 6, 4)
  ).join('');

  const labelOrAccountName =
    accountName === label ? toUpper(accountName) : label;
  const accountSymbol = new GraphemeSplitter().splitGraphemes(
    labelOrAccountName || toUpper(accountENS) || `${index + 1}`
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
