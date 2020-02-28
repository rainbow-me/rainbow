import { useSelector } from 'react-redux';
import {
  createLanguageSelector,
  createNativeCurrencySelector,
} from '../hoc/accountSettingsSelectors';

export default function useAccountSettings() {
  const { language } = useSelector(createLanguageSelector);
  const { nativeCurrencySymbol } = useSelector(createNativeCurrencySelector);
  return useSelector(
    ({ settings: { accountAddress, chainId, nativeCurrency, network } }) => ({
      accountAddress,
      chainId,
      language,
      nativeCurrency,
      nativeCurrencySymbol,
      network,
    })
  );
}
