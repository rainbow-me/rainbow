import GraphemeSplitter from 'grapheme-splitter';
import { toUpper } from 'lodash';
import { useSelector } from 'react-redux';
import { removeFirstEmojiFromString } from '../helpers/emojiHandler';
import { address } from '../utils/abbreviations';

export default function useAccountProfile() {
  const selectedWallet = useSelector(({ wallets: { selected } }) => selected);
  const accountData = useSelector(
    ({ settings: { accountAddress, accountENS } }) => ({
      accountAddress,
      accountENS,
    })
  );

  if (!selectedWallet) return {};
  if (!accountData) return {};

  const { accountENS, accountAddress } = accountData;

  if (!selectedWallet || !selectedWallet.addresses.length) return {};

  const selectedAccount = selectedWallet.addresses.find(
    account => account.address === accountAddress
  );

  if (!selectedAccount) return {};

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
