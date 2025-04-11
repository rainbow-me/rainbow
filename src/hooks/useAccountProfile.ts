import { useWalletsStore } from '../redux/wallets';

export default function useAccountProfile() {
  const { accountColor, accountENS, accountImage, accountName, accountSymbol } = useWalletsStore(state => state.getAccountProfileInfo());
  const accountAddress = useWalletsStore(state => state.accountAddress);

  return {
    accountAddress,
    accountColor,
    accountENS,
    accountImage,
    accountName,
    accountSymbol,
  };
}
