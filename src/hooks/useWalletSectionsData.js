import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { buildWalletSectionsSelector } from '../helpers/buildWalletSections';
import { sortAssetsByNativeAmountSelector } from '../hoc/assetSelectors';
import {
  createLanguageSelector,
  createNativeCurrencySelector,
} from '../hoc/accountSettingsSelectors';
import { sendableUniqueTokensSelector } from '../hoc/uniqueTokenSelectors';
import { readableUniswapSelector } from '../hoc/uniswapLiquidityTokenInfoSelector';
import useSavingsAccount from './useSavingsAccount';

export default function useWalletSectionsData() {
  const isWalletEthZero = useSelector(
    ({ isWalletEthZero: { isWalletEthZero } }) => ({
      isWalletEthZero,
    })
  );

  const accountData = useSelector(sortAssetsByNativeAmountSelector);
  const language = useSelector(createLanguageSelector);
  const nativeCurrency = useSelector(createNativeCurrencySelector);
  const uniqueTokens = useSelector(sendableUniqueTokensSelector);
  const uniswap = useSelector(readableUniswapSelector);

  const accountSavings = useSavingsAccount();

  const walletSections = useMemo(() => {
    const accountInfo = {
      ...accountData,
      ...language,
      ...nativeCurrency,
      ...uniqueTokens,
      ...uniswap,
      ...isWalletEthZero,
      savings: accountSavings,
    };
    const creation = buildWalletSectionsSelector(accountInfo);
    return {
      ...accountInfo,
      ...creation,
    };
  }, [
    accountData,
    accountSavings,
    isWalletEthZero,
    language,
    nativeCurrency,
    uniqueTokens,
    uniswap,
  ]);
  return walletSections;
}
