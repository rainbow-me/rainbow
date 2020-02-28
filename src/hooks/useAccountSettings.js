import { useSelector } from 'react-redux';
import {
  createLanguageSelector,
  createNativeCurrencySelector,
} from '../hoc/accountSettingsSelectors';

export default function useAccountSettings() {
  const { language } = useSelector(createLanguageSelector);
  const { nativeCurrencySymbol } = useSelector(createNativeCurrencySelector);
  return useSelector(
    ({ settings: { accountAddress, chainId, nativeCurrency } }) => ({
      accountAddress,
      chainId,
      language,
      nativeCurrency,
      nativeCurrencySymbol,
    })
  );
}
