import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import useCoinListEditOptions from './useCoinListEditOptions';
import useCoinListEdited from './useCoinListEdited';
import useSavingsAccount from './useSavingsAccount';
import useSendableUniqueTokens from './useSendableUniqueTokens';
import useShowcaseTokens from './useShowcaseTokens';
import useSortedAccountAssets from './useSortedAccountAssets';
import { buildBriefWalletSectionsSelector } from '@rainbow-me/helpers/buildWalletSections';
import { readableUniswapSelector } from '@rainbow-me/helpers/uniswapLiquidityTokenInfoSelector';

export default function useWalletSectionsData() {
  const { isLoadingAssets, sortedAssets } = useSortedAccountAssets();

  const { nativeCurrency } = useAccountSettings();
  const { uniqueTokens } = useSendableUniqueTokens();
  const { uniswap, uniswapTotal } = useSelector(readableUniswapSelector);
  const { showcaseTokens } = useShowcaseTokens();

  const { hiddenCoins, pinnedCoins } = useCoinListEditOptions();

  const { refetchSavings, savings, shouldRefetchSavings } = useSavingsAccount(
    true
  );

  const isCoinListEdited = useCoinListEdited();

  const walletSections = useMemo(() => {
    const accountInfo = {
      hiddenCoins,
      isCoinListEdited,
      isLoadingAssets,
      nativeCurrency,
      pinnedCoins,
      savings,
      showcaseTokens,
      sortedAssets,
      uniqueTokens,
      uniswap,
      uniswapTotal,
    };

    const briefSectionsData = buildBriefWalletSectionsSelector(accountInfo);

    return {
      briefSectionsData,
      refetchSavings,
      shouldRefetchSavings,
    };
  }, [
    hiddenCoins,
    isCoinListEdited,
    isLoadingAssets,
    nativeCurrency,
    pinnedCoins,
    refetchSavings,
    savings,
    shouldRefetchSavings,
    showcaseTokens,
    sortedAssets,
    uniqueTokens,
    uniswap,
    uniswapTotal,
  ]);
  return walletSections;
}
