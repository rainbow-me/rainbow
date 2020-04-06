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

  const accountData = useAccountAssets();
  const { language, network, nativeCurrency } = useAccountSettings();
  const uniqueTokens = useSendableUniqueTokens();
  const uniswap = useSelector(readableUniswapSelector);

  const accountSavings = useSavingsAccount(true);

  const walletSections = useMemo(() => {
    const accountInfo = {
      language,
      nativeCurrency,
      network,
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
    network,
    uniqueTokens,
    uniswap,
  ]);
  return walletSections;
}
