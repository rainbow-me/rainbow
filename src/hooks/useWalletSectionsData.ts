import { useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import useCoinListEditOptions from './useCoinListEditOptions';
import useCoinListEdited from './useCoinListEdited';
import useHiddenTokens from './useHiddenTokens';
import useIsWalletEthZero from './useIsWalletEthZero';
import useSendableUniqueTokens from './useSendableUniqueTokens';
import useShowcaseTokens from './useShowcaseTokens';
import useWallets from './useWallets';
import { buildBriefWalletSectionsSelector } from '@/helpers/buildWalletSections';
import { useSortedUserAssets } from '@/resources/assets/useSortedUserAssets';
import { useLegacyNFTs } from '@/resources/nfts';

export default function useWalletSectionsData({
  type,
}: {
  type?: string;
} = {}) {
  const {
    isLoading: isLoadingUserAssets,
    data: sortedAssets = [],
  } = useSortedUserAssets();
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
  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();
  const { isReadOnlyWallet } = useWallets();

  const {
    hiddenCoinsObj: hiddenCoins,
    pinnedCoinsObj: pinnedCoins,
  } = useCoinListEditOptions();

  const { isCoinListEdited } = useCoinListEdited();

  const walletSections = useMemo(() => {
    const accountInfo = {
      hiddenCoins,
      isCoinListEdited,
      isLoadingUserAssets,
      language,
      nativeCurrency,
      network,
      pinnedCoins,
      sendableUniqueTokens,
      sortedAssets,
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
      briefSectionsData,
    };
  }, [
    allUniqueTokens,
    hiddenCoins,
    hiddenTokens,
    isCoinListEdited,
    isLoadingUserAssets,
    isReadOnlyWallet,
    isWalletEthZero,
    language,
    nativeCurrency,
    network,
    pinnedCoins,
    showcaseTokens,
    sortedAssets,
    type,
    sendableUniqueTokens,
  ]);
  return walletSections;
}
