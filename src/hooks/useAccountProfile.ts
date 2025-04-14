import { useWalletsStore } from '@/state/wallets/wallets';
import { useTheme } from '../theme';

export default function useAccountProfile() {
  const { accountColor, accountENS, accountImage, accountName, accountSymbol } = useWalletsStore(state => state.getAccountProfileInfo());
  const accountAddress = useWalletsStore(state => state.accountAddress);
  const { colors } = useTheme();

  return {
    accountAddress,
    accountColor,
    accountColorString: colors.avatarBackgrounds[accountColor],
    accountENS,
    accountImage,
    accountName,
    accountSymbol,
  };
}
