import {
  createLanguageSelector,
  createNativeCurrencySelector,
} from '../hoc/accountSettingsSelectors';
import {
  settingsUpdateAccountColor,
  settingsUpdateAccountName,
} from '../redux/settings';
import { useSelector } from '@rainbow-me/react-redux';

export default function useAccountSettings() {
  const { language } = useSelector(createLanguageSelector);
  const { nativeCurrencySymbol } = useSelector(createNativeCurrencySelector);
  const settingsData = useSelector(
    ({
      settings: {
        accountAddress,
        accountColor,
        accountName,
        chainId,
        nativeCurrency,
        network,
      },
    }) => ({
      accountAddress,
      accountColor,
      accountName,
      chainId,
      language,
      nativeCurrency,
      nativeCurrencySymbol,
      network,
    })
  );
  return {
    settingsUpdateAccountColor,
    settingsUpdateAccountName,
    ...settingsData,
  };
}
