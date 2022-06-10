import { get } from 'lodash';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '../helpers/emojiHandler';
import { address } from '../utils/abbreviations';
import { addressHashedEmoji, isValidImagePath } from '../utils/profileUtils';

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
  const { label, color, image } = selectedAccount;

  const labelWithoutEmoji = label && removeFirstEmojiFromString(label);

  const accountName =
    labelWithoutEmoji || accountENS || address(accountAddress, 4, 4);

  const emojiAvatar = returnStringFirstEmoji(label);

  const accountSymbol = returnStringFirstEmoji(
    emojiAvatar || addressHashedEmoji(accountAddress)
  );
  const accountColor = color;
  const accountImage = isValidImagePath(image) ? image : null;

  return {
    accountAddress,
    accountColor,
    accountENS,
    accountImage,
    accountName,
    accountSymbol,
  };
}
