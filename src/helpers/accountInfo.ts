import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '@/helpers/emojiHandler';
import { address } from '@/utils/abbreviations';
import { addressHashedEmoji, isValidImagePath } from '@/utils/profileUtils';
import { RainbowAccount, RainbowWallet } from '@/model/wallet';

export function getAccountProfileInfo(
  selectedWallet: RainbowWallet | undefined,
  walletNames: { [p: string]: string },
  accountAddress: string
) {
  if (!selectedWallet) {
    return {
      accountAddress,
    };
  }

  if (!selectedWallet?.addresses?.length) {
    return { accountAddress };
  }

  const accountENS = walletNames?.[accountAddress];

  const selectedAccount = selectedWallet.addresses.find(
    (account: RainbowAccount) => account.address === accountAddress
  );

  if (!selectedAccount) {
    return {
      accountAddress,
    };
  }
  const { label, color, image } = selectedAccount;

  const labelWithoutEmoji = label && removeFirstEmojiFromString(label);

  const accountName: string | undefined =
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
