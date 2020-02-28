import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { buildWalletSectionsSelector } from '../helpers/buildWalletSections';
import useAccountAssets from './useAccountAssets';
import useAccountSettings from './useAccountSettings';
import useSendableUniqueTokens from './useSendableUniqueTokens';
import { readableUniswapSelector } from '../hoc/uniswapLiquidityTokenInfoSelector';
import useSavingsAccount from './useSavingsAccount';

export default function useWalletSectionsData() {
  const isWalletEthZero = useSelector(
    ({ isWalletEthZero: { isWalletEthZero } }) => ({
      isWalletEthZero,
    })
  );

  // TODO JIN select exactly what I need for build wallet sections
  const accountData = useAccountAssets();
  const { language, nativeCurrency } = useAccountSettings();
  const uniqueTokens = useSendableUniqueTokens();
  const uniswap = useSelector(readableUniswapSelector);

  const accountSavings = useSavingsAccount();

  const walletSections = useMemo(() => {
    const accountInfo = {
      language,
      nativeCurrency,
      ...accountData,
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
