import { Network } from '@/helpers';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { AppState } from '@/redux/store';
import { useSelector } from 'react-redux';
import { useAccountSettings } from '.';

export default function useWalletSections() {
  const { accountAddress, network } = useAccountSettings();
  const sortedAssets = useSelector((state: AppState) => state.sortedAssets);
  const hiddenCoins = useSelector((state: AppState) => state.hiddenCoins);
  const isCoinListEdited = useSelector(
    (state: AppState) => state.isCoinListEdited
  );
  const isLoadingAssets = useSelector(
    (state: AppState) => state.isLoadingAssets
  );
  const isReadOnlyWallet = useSelector(
    (state: AppState) => state.isReadOnlyWallet
  );
  const nativeCurrency = useSelector((state: AppState) => state.nativeCurrency);
  const pinnedCoins = useSelector((state: AppState) => state.pinnedCoins);
  const savings = useSelector((state: AppState) => state.savings);
  const sellingTokens = useSelector((state: AppState) => state.sellingTokens);
  const showcaseTokens = useSelector((state: AppState) => state.showcaseTokens);
  const hiddenTokens = useSelector((state: AppState) => state.hiddenTokens);
  const uniswap = useSelector((state: AppState) => state.uniswap);
  const uniswapTotal = useSelector((state: AppState) => state.uniswapTotal);
  const listType = useSelector((state: AppState) => state.listType);

  const buildBriefWalletSections = (
    balanceSectionData: any,
    savings: any,
    uniqueTokenFamiliesSection: any,
    uniswapSection: any
  ) => {
    const { balanceSection, isEmpty } = balanceSectionData;
    const sections = [
      balanceSection,
      savings,
      uniswapSection,
      uniqueTokenFamiliesSection,
    ];

    const filteredSections = sections
      .filter(section => section.length !== 0)
      .flat(1);

    return {
      briefSectionsData: filteredSections,
      isEmpty,
    };
  };

  const pools = uniswap.map((pool: any) => ({
    address: pool.address,
    type: 'UNISWAP_POOL',
    uid: 'pool-' + pool.address,
  }));

  const buildBriefUniswapSection = (
    uniswap: any,
    uniswapTotal: any,
    nativeCurrency: any,
    network: any,
    isLoadingAssets: any
  ) => {
    const pools = uniswap.map((pool: any) => ({
      address: pool.address,
      type: 'UNISWAP_POOL',
      uid: 'pool-' + pool.address,
    }));
    ``;

    if (pools.length > 0 && network === Network.mainnet && !isLoadingAssets) {
      return [
        {
          type: 'POOLS_HEADER',
          uid: 'pools-header',
          value: convertAmountToNativeDisplay(uniswapTotal, nativeCurrency),
        },
        ...pools,
      ];
    }
    return [];
  };
}
