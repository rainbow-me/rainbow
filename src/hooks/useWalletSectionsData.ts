import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import useCoinListEditOptions from './useCoinListEditOptions';
import useCoinListEdited from './useCoinListEdited';
import useIsWalletEthZero from './useIsWalletEthZero';
import useSavingsAccount from './useSavingsAccount';
import useShowcaseTokens from './useShowcaseTokens';
import useSortedAccountAssets from './useSortedAccountAssets';
import { AppState } from '@/redux/store';
import {
  buildBriefWalletSectionsSelector,
  buildWalletSectionsSelector,
} from '@rainbow-me/helpers/buildWalletSections';
import { readableUniswapSelector } from '@rainbow-me/helpers/uniswapLiquidityTokenInfoSelector';

interface Props {
  type?: string;
  withVideos?: boolean;
}
export default function useWalletSectionsData({
  type,
  withVideos = true,
}: Props = {}) {
  const sortedAccountData = useSortedAccountAssets();
  const isWalletEthZero = useIsWalletEthZero();

  const { language, network, nativeCurrency } = useAccountSettings();
  const allUniqueTokens = useSelector(
    (state: AppState) => state.uniqueTokens.uniqueTokens
  );
  const uniswap = useSelector(readableUniswapSelector);
  const { showcaseTokens } = useShowcaseTokens();

  const {
    hiddenCoinsObj: hiddenCoins,
    pinnedCoinsObj: pinnedCoins,
  } = useCoinListEditOptions();

  const { refetchSavings, savings, shouldRefetchSavings } = useSavingsAccount(
    true
  );

  const { isCoinListEdited } = useCoinListEdited();

  const isImage = (uniqueToken: any) => !uniqueToken.animation_url;

  const uniqueImageTokens = useMemo(
    () => allUniqueTokens.filter((uniqueToken: any) => isImage(uniqueToken)),
    [allUniqueTokens]
  );

  const walletSections = useMemo(() => {
    const accountInfo = {
      hiddenCoins,
      isCoinListEdited,
      language,
      nativeCurrency,
      network,
      pinnedCoins,
      savings,
      uniqueTokens: withVideos ? allUniqueTokens : uniqueImageTokens,
      ...sortedAccountData,
      ...uniswap,
      // @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
      ...isWalletEthZero,
      listType: type,
      showcaseTokens,
    };

    const sectionsData = buildWalletSectionsSelector(accountInfo);
    const briefSectionsData = buildBriefWalletSectionsSelector(accountInfo);
    const hasNFTs = allUniqueTokens.length > 0;

    return {
      hasNFTs,
      isWalletEthZero,
      refetchSavings,
      shouldRefetchSavings,
      ...sectionsData,
      briefSectionsData,
    };
  }, [
    allUniqueTokens,
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
    sortedAccountData,
    type,
    uniqueImageTokens,
    uniswap,
    withVideos,
  ]);
  return walletSections;
}
