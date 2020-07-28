import GraphemeSplitter from 'grapheme-splitter';
import { get, toUpper } from 'lodash';
import { removeFirstEmojiFromString } from '../helpers/emojiHandler';
import networkTypes from '../helpers/networkTypes';
import { address } from '../utils/abbreviations';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';

export default function useAccountProfile() {
  const { selectedWallet, walletNames } = useWallets();

  const { accountAddress } = useAccountSettings();
  const { network } = useAccountSettings();

  if (!selectedWallet) return {};
  if (!accountAddress) return {};

  if (!selectedWallet || !selectedWallet?.addresses?.length) return {};

  const accountENS = get(walletNames, `${accountAddress}`);

  const selectedAccount = selectedWallet.addresses.find(
    account => account.address === accountAddress
  );

  if (!selectedAccount) return {};

  const { label, color, index } = selectedAccount;
  const accountColor = color;

  if (network === networkTypes.mainnet) {
    const accountName = removeFirstEmojiFromString(
      label || accountENS || address(accountAddress, 6, 4)
    ).join('');
    const labelOrAccountName =
      accountName === label ? toUpper(accountName) : label;
    const accountSymbol = new GraphemeSplitter().splitGraphemes(
      labelOrAccountName || toUpper(accountENS) || `${index + 1}`
    )[0];

    return {
      accountAddress,
      accountColor,
      accountENS,
      accountName,
      accountSymbol,
    };
  } else {
    const accountName = removeFirstEmojiFromString(
      label === accountENS
        ? address(accountAddress, 6, 4)
        : label || address(accountAddress, 6, 4)
    ).join('');

    const accountSymbol = new GraphemeSplitter().splitGraphemes(
      label === accountENS
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
}
