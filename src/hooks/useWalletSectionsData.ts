import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import useCoinListEditOptions from './useCoinListEditOptions';
import useCoinListEdited from './useCoinListEdited';
import useHiddenTokens from './useHiddenTokens';
import useIsWalletEthZero from './useIsWalletEthZero';
import useSavingsAccount from './useSavingsAccount';
import useSendableUniqueTokens from './useSendableUniqueTokens';
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

  const {
    accountAddress,
    language,
    network,
    nativeCurrency,
  } = useAccountSettings();
  const { sendableUniqueTokens } = useSendableUniqueTokens();
  const {
    data: { nfts: allUniqueTokens },
  } = useLegacyNFTs({
    address: accountAddress,
  });
  const uniswap = useSelector(readableUniswapSelector);
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
      language,
      nativeCurrency,
      network,
      pinnedCoins,
      savings,
      sendableUniqueTokens,
      ...sortedAccountData,
      ...uniswap,
      // @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
      ...isWalletEthZero,
      hiddenTokens,
      isReadOnlyWallet,
      listType: type,
      showcaseTokens,
      uniqueTokens: allUniqueTokens,
    };

    const { briefSectionsData, isEmpty } = buildBriefWalletSectionsSelector(
      accountInfo
    );
    const hasNFTs = allUniqueTokens.length > 0;

    return {
      hasNFTs,
      isEmpty,
      isWalletEthZero,
      refetchSavings,
      shouldRefetchSavings,
      briefSectionsData,
    };
  }, [
    allUniqueTokens,
    hiddenCoins,
    hiddenTokens,
    isCoinListEdited,
    isReadOnlyWallet,
    isWalletEthZero,
    language,
    nativeCurrency,
    network,
    pinnedCoins,
    refetchSavings,
    savings,
    shouldRefetchSavings,
    showcaseTokens,
    sortedAccountData,
    type,
    sendableUniqueTokens,
    uniswap,
  ]);
  return walletSections;
}
