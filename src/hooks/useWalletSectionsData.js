import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { buildWalletSectionsSelector } from '../helpers/buildWalletSections';
import useAccountAssets from './useAccountAssets';
import useAccountSettings from './useAccountSettings';
import useSendableUniqueTokens from './useSendableUniqueTokens';
import useCoinListEditOptions from './useCoinListEditOptions';
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

  const {
    currentAction,
    hiddenCoins,
    isCoinListEdited,
    pinnedCoins,
  } = useCoinListEditOptions();

  const accountSavings = useSavingsAccount(true);

  const walletSections = useMemo(() => {
    const accountInfo = {
      currentAction,
      hiddenCoins,
      isCoinListEdited,
      language,
      nativeCurrency,
      network,
      pinnedCoins,
      savings: accountSavings,
      ...accountData,
      ...uniqueTokens,
      ...uniswap,
      ...isWalletEthZero,
    };
    const creation = buildWalletSectionsSelector(accountInfo);
    return {
      ...accountInfo,
      ...creation,
    };
  }, [
    accountData,
    accountSavings,
    currentAction,
    hiddenCoins,
    isCoinListEdited,
    isWalletEthZero,
    language,
    nativeCurrency,
    network,
    pinnedCoins,
    uniqueTokens,
    uniswap,
  ]);
  return walletSections;
}
