import { address } from '../utils/abbreviations';
import { isValidImagePath } from '../utils/profileUtils';

export function getAccountProfileInfo(
  selectedWallet: any,
  walletNames: any,
  accountAddress: any
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

  const accountENS = walletNames?.[accountAddress];

  const selectedAccount = selectedWallet.addresses.find(
    (account: any) => account.address === accountAddress
  );

  if (!selectedAccount) {
    return {};
  }
  const { label, color, emoji, image } = selectedAccount;

  return {
    accountAddress,
    accountColor: color,
    accountENS,
    accountImage: isValidImagePath(image) ? image : null,
    accountName: label || accountENS || address(accountAddress, 4, 4),
    accountSymbol: emoji,
  };
}
