import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useAccountAssets from './useAccountAssets';
import useAccountSettings from './useAccountSettings';
import useCoinListEditOptions from './useCoinListEditOptions';
import useIsWalletEthZero from './useIsWalletEthZero';
import useSavingsAccount from './useSavingsAccount';
import useSendableUniqueTokens from './useSendableUniqueTokens';
import useShowcaseTokens from './useShowcaseTokens';
import { buildWalletSectionsSelector } from '@rainbow-me/helpers/buildWalletSections';
import { readableUniswapSelector } from '@rainbow-me/helpers/uniswapLiquidityTokenInfoSelector';

export default function useWalletSectionsData() {
  const accountData = useAccountAssets();
  const isWalletEthZero = useIsWalletEthZero();

  const { language, network, nativeCurrency } = useAccountSettings();
  const uniqueTokens = useSendableUniqueTokens();
  const uniswap = useSelector(readableUniswapSelector);
  const { showcaseTokens } = useShowcaseTokens();

  const {
    currentAction,
    hiddenCoins,
    isCoinListEdited,
    pinnedCoins,
  } = useCoinListEditOptions();

  const { refetchSavings, savings, shouldRefetchSavings } = useSavingsAccount(
    true
  );

  const walletSections = useMemo(() => {
    const accountInfo = {
      currentAction,
      hiddenCoins,
      isCoinListEdited,
      language,
      nativeCurrency,
      network,
      pinnedCoins,
      savings,
      ...accountData,
      ...uniqueTokens,
      ...uniswap,
      ...isWalletEthZero,
      showcaseTokens,
    };

    const sectionsData = buildWalletSectionsSelector(accountInfo);

    return {
      isWalletEthZero,
      refetchSavings,
      shouldRefetchSavings,
      ...sectionsData,
    };
  }, [
    accountData,
    currentAction,
    hiddenCoins,
    isCoinListEdited,
    isWalletEthZero,
    language,
    nativeCurrency,
    network,
    pinnedCoins,
    refetchSavings,
    savings,
    shouldRefetchSavings,
    showcaseTokens,
    uniqueTokens,
    uniswap,
  ]);
  return walletSections;
}
