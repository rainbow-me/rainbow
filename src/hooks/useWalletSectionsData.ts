import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import useCoinListEditOptions from './useCoinListEditOptions';
import useCoinListEdited from './useCoinListEdited';
import useHiddenTokens from './useHiddenTokens';
import useIsWalletEthZero from './useIsWalletEthZero';
import useSavingsAccount from './useSavingsAccount';
import useShowcaseTokens from './useShowcaseTokens';
import useSortedAccountAssets from './useSortedAccountAssets';
import useWallets from './useWallets';
import { buildBriefWalletSectionsSelector } from '@/helpers/buildWalletSections';
import { readableUniswapSelector } from '@/helpers/uniswapLiquidityTokenInfoSelector';
import { useLegacyNFTs } from '@/resources/nfts';

export default function useWalletSectionsData({
  type,
}: {
  type?: string;
} = {}) {
  const sortedAccountData = useSortedAccountAssets();
  const isWalletEthZero = useIsWalletEthZero();

  const { accountAddress, network, nativeCurrency } = useAccountSettings();
  const uniswap = useSelector(readableUniswapSelector);
  const { data: nfts } = useLegacyNFTs({ address: accountAddress });
  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();
  const { isReadOnlyWallet } = useWallets();

  const {
    hiddenCoinsObj: hiddenCoins,
    pinnedCoinsObj: pinnedCoins,
  } = useCoinListEditOptions();

  const { refetchSavings, savings, shouldRefetchSavings } = useSavingsAccount(
    true
  );

  const { isCoinListEdited } = useCoinListEdited();

  const walletSections = useMemo(() => {
    const accountInfo = {
      hiddenCoins,
      isCoinListEdited,
      nativeCurrency,
      network,
      pinnedCoins,
      savings,
      ...sortedAccountData,
      uniqueTokens: nfts,
      ...uniswap,
      hiddenTokens,
      isReadOnlyWallet,
      listType: type,
      showcaseTokens,
    };

    const { briefSectionsData, isEmpty } = buildBriefWalletSectionsSelector(
      accountInfo
    );
    const hasNFTs = nfts.length > 0;

    return {
      hasNFTs,
      isEmpty,
      isWalletEthZero,
      refetchSavings,
      shouldRefetchSavings,
      briefSectionsData,
    };
  }, [
    hiddenCoins,
    isCoinListEdited,
    nativeCurrency,
    network,
    pinnedCoins,
    savings,
    sortedAccountData,
    nfts,
    uniswap,
    hiddenTokens,
    isReadOnlyWallet,
    type,
    showcaseTokens,
    isWalletEthZero,
    refetchSavings,
    shouldRefetchSavings,
  ]);
  return walletSections;
}
