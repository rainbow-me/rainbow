import lang from 'i18n-js';
import { getAddress, isAddress } from '@ethersproject/address';
import { EthereumAddress } from '@rainbow-me/swaps';
import { Contract } from '@ethersproject/contracts';
import { rankings } from 'match-sorter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import usePrevious from './usePrevious';
import { RainbowToken, TokenSearchTokenListId } from '@/entities';
import { tokenSearch } from '@/handlers/tokenSearch';
import { addHexPrefix, getProvider } from '@/handlers/web3';
import tokenSectionTypes from '@/helpers/tokenSectionTypes';
import { DAI_ADDRESS, erc20ABI, ETH_ADDRESS, rainbowTokenList, USDC_ADDRESS, WBTC_ADDRESS, WETH_ADDRESS } from '@/references';
import { filterList, isLowerCaseMatch } from '@/utils';
import { logger } from '@/logger';
import { CROSSCHAIN_SWAPS, useExperimentalFlag } from '@/config';
import { IS_TEST } from '@/env';
import { useFavorites } from '@/resources/favorites';
import { getUniqueId } from '@/utils/ethereumUtils';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

type swapCurrencyListType =
  | 'verifiedAssets'
  | 'highLiquidityAssets'
  | 'lowLiquidityAssets'
  | 'favoriteAssets'
  | 'curatedAssets'
  | 'importedAssets';

type CrosschainVerifiedAssets = Record<
  ChainId.mainnet | ChainId.optimism | ChainId.polygon | ChainId.bsc | ChainId.arbitrum,
  RainbowToken[]
>;

const abcSort = (list: any[], key?: string) => {
  return list.sort((a, b) => {
    return key ? a[key]?.localeCompare(b[key]) : a?.localeCompare(b);
  });
};

const searchCurrencyList = async (searchParams: {
  chainId: number;
  searchList: RainbowToken[] | TokenSearchTokenListId;
  query: string;
}) => {
  const { searchList, query, chainId } = searchParams;
  const isAddress = query.match(/^(0x)?[0-9a-fA-F]{40}$/);
  const keys: (keyof RainbowToken)[] = isAddress ? ['address'] : ['symbol', 'name'];
  const formattedQuery = isAddress ? addHexPrefix(query).toLowerCase() : query;
  if (typeof searchList === 'string') {
    const threshold = isAddress ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS';
    if (chainId === ChainId.mainnet && !formattedQuery && searchList !== 'verifiedAssets') {
      return [];
    }
    const ts = await tokenSearch({
      chainId,
      keys,
      list: searchList,
      threshold,
      query: formattedQuery,
    });
    return ts;
  } else {
    return (
      filterList(searchList, formattedQuery, keys, {
        threshold: isAddress ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
      }) || []
    );
  }
};

const useSearchCurrencyList = (searchQuery: string, searchChainId = ChainId.mainnet) => {
  const previousChainId = usePrevious(searchChainId);

  const searching = useMemo(() => searchQuery !== '' || ChainId.mainnet !== searchChainId, [searchChainId, searchQuery]);

  const { favorites: favoriteAddresses, favoritesMetadata: favoriteMap } = useFavorites();
  const curatedMap = rainbowTokenList.CURATED_TOKENS;
  const unfilteredFavorites = Object.values(favoriteMap).filter(token => token.networks[searchChainId]);

  const [loading, setLoading] = useState(true);
  const [favoriteAssets, setFavoriteAssets] = useState<RainbowToken[]>([]);
  const [importedAssets, setImportedAssets] = useState<RainbowToken[]>([]);
  const [highLiquidityAssets, setHighLiquidityAssets] = useState<RainbowToken[]>([]);
  const [lowLiquidityAssets, setLowLiquidityAssets] = useState<RainbowToken[]>([]);
  const [verifiedAssets, setVerifiedAssets] = useState<RainbowToken[]>([]);
  const [fetchingCrosschainAssets, setFetchingCrosschainAssets] = useState(false);
  const [crosschainVerifiedAssets, setCrosschainVerifiedAssets] = useState<CrosschainVerifiedAssets>({
    [ChainId.apechain]: [],
    [ChainId.arbitrum]: [],
    [ChainId.avalanche]: [],
    [ChainId.base]: [],
    [ChainId.bsc]: [],
    [ChainId.blast]: [],
    [ChainId.degen]: [],
    [ChainId.gnosis]: [],
    [ChainId.gravity]: [],
    [ChainId.ink]: [],
    [ChainId.linea]: [],
    [ChainId.mainnet]: [],
    [ChainId.optimism]: [],
    [ChainId.polygon]: [],
    [ChainId.sanko]: [],
    [ChainId.scroll]: [],
    [ChainId.zksync]: [],
    [ChainId.zora]: [],
  });

  const crosschainSwapsEnabled = useExperimentalFlag(CROSSCHAIN_SWAPS);

  const isFavorite = useCallback(
    (address: EthereumAddress) => favoriteAddresses.map(a => a?.toLowerCase()).includes(address?.toLowerCase()),
    [favoriteAddresses]
  );
  const handleSearchResponse = useCallback(
    (tokens: RainbowToken[]): RainbowToken[] => {
      // These transformations are necessary for L2 tokens to match our spec
      return (tokens || [])
        .map(token => {
          const t: RainbowToken = {
            ...token,
            address: token?.address || token.uniqueId.toLowerCase(),
          } as RainbowToken;

          return t;
        })
        .filter(({ address }) => !isFavorite(address));
    },
    [isFavorite]
  );

  const getCurated = useCallback(() => {
    const addresses = favoriteAddresses.map(a => a.toLowerCase());
    return Object.values(curatedMap)
      .filter(({ address }) => !addresses.includes(address.toLowerCase()))
      .sort((t1, t2) => {
        const { address: address1, name: name1 } = t1;
        const { address: address2, name: name2 } = t2;
        const mainnetPriorityTokens = [ETH_ADDRESS, WETH_ADDRESS, DAI_ADDRESS, USDC_ADDRESS, WBTC_ADDRESS];
        const rankA = mainnetPriorityTokens.findIndex(address => address === address1.toLowerCase());
        const rankB = mainnetPriorityTokens.findIndex(address => address === address2.toLowerCase());
        const aIsRanked = rankA > -1;
        const bIsRanked = rankB > -1;
        if (aIsRanked) {
          if (bIsRanked) {
            return rankA > rankB ? -1 : 1;
          }
          return -1;
        }
        return bIsRanked ? 1 : name1?.localeCompare(name2);
      });
  }, [curatedMap, favoriteAddresses]);

  const getFavorites = useCallback(async () => {
    return searching
      ? await searchCurrencyList({
          searchList: unfilteredFavorites as RainbowToken[],
          query: searchQuery,
          chainId: searchChainId,
        })
      : unfilteredFavorites;
  }, [searchChainId, searchQuery, searching, unfilteredFavorites]);

  const getImportedAsset = useCallback(
    async (searchQuery: string, chainId: number): Promise<RainbowToken[] | null> => {
      if (searching) {
        if (isAddress(searchQuery)) {
          const tokenListEntry = rainbowTokenList.RAINBOW_TOKEN_LIST[searchQuery.toLowerCase()];
          if (tokenListEntry) {
            return [tokenListEntry];
          }
          const provider = getProvider({ chainId });
          const tokenContract = new Contract(searchQuery, erc20ABI, provider);
          try {
            const [name, symbol, decimals, address] = await Promise.all([
              tokenContract.name(),
              tokenContract.symbol(),
              tokenContract.decimals(),
              getAddress(searchQuery),
            ]);
            const uniqueId = getUniqueId(address, chainId);

            return [
              {
                chainId,
                address,
                decimals,
                favorite: false,
                highLiquidity: false,
                isRainbowCurated: false,
                isVerified: false,
                name,
                networks: {
                  [chainId]: {
                    address,
                    decimals,
                  },
                },
                symbol,
                network: useBackendNetworksStore.getState().getChainsName()[chainId],
                uniqueId,
              } as RainbowToken,
            ];
          } catch (e) {
            logger.warn('[useSearchCurrencyList]: error getting token data', { error: (e as Error).message });
            return null;
          }
        }
      }
      return null;
    },
    [searching]
  );

  const getCrosschainVerifiedAssetsForNetwork = useCallback(
    async (chainId: ChainId) => {
      const results = await searchCurrencyList({
        searchList: 'verifiedAssets',
        query: '',
        chainId,
      });
      setCrosschainVerifiedAssets(state => ({
        ...state,
        [chainId]: handleSearchResponse(results || []),
      }));
    },
    [handleSearchResponse]
  );

  const getCrosschainVerifiedAssets = useCallback(async () => {
    const crosschainAssetRequests: Promise<void>[] = [];
    Object.keys(crosschainVerifiedAssets).forEach(chainId => {
      crosschainAssetRequests.push(getCrosschainVerifiedAssetsForNetwork(Number(chainId)));
    });
    await Promise.all(crosschainAssetRequests);
  }, [crosschainVerifiedAssets, getCrosschainVerifiedAssetsForNetwork]);

  const getResultsForAssetType = useCallback(
    async (assetType: swapCurrencyListType) => {
      switch (assetType) {
        case 'verifiedAssets':
          setVerifiedAssets(
            handleSearchResponse(
              await searchCurrencyList({
                searchList: assetType,
                query: searchQuery,
                chainId: searchChainId,
              })
            )
          );
          break;
        case 'highLiquidityAssets':
          setHighLiquidityAssets(
            handleSearchResponse(
              await searchCurrencyList({
                searchList: assetType,
                query: searchQuery,
                chainId: searchChainId,
              })
            )
          );
          break;
        case 'lowLiquidityAssets':
          setLowLiquidityAssets(
            handleSearchResponse(
              await searchCurrencyList({
                searchList: assetType,
                query: searchQuery,
                chainId: searchChainId,
              })
            )
          );
          break;
        case 'favoriteAssets':
          setFavoriteAssets((await getFavorites()) || []);
          break;
        case 'importedAssets': {
          const importedAssetResult = await getImportedAsset(searchQuery, searchChainId);
          if (importedAssetResult) {
            setImportedAssets(handleSearchResponse(importedAssetResult));
          }
          break;
        }
      }
    },
    [getFavorites, getImportedAsset, handleSearchResponse, searchQuery, searchChainId]
  );

  const search = useCallback(async () => {
    const categories: swapCurrencyListType[] =
      searchChainId === ChainId.mainnet
        ? ['favoriteAssets', 'highLiquidityAssets', 'verifiedAssets', 'importedAssets']
        : ['verifiedAssets', 'importedAssets'];
    setLoading(true);
    await Promise.all(categories.map(assetType => getResultsForAssetType(assetType)));
  }, [searchChainId, getResultsForAssetType]);

  const slowSearch = useCallback(async () => {
    try {
      await getResultsForAssetType('lowLiquidityAssets');
      // eslint-disable-next-line no-empty
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [getResultsForAssetType]);

  const clearSearch = useCallback(() => {
    getResultsForAssetType('curatedAssets');
    setLowLiquidityAssets([]);
    setHighLiquidityAssets([]);
    setVerifiedAssets([]);
    setImportedAssets([]);
  }, [getResultsForAssetType]);

  const wasSearching = usePrevious(searching);
  const previousSearchQuery = usePrevious(searchQuery);

  useEffect(() => {
    if (!fetchingCrosschainAssets && crosschainSwapsEnabled) {
      setFetchingCrosschainAssets(true);
      getCrosschainVerifiedAssets();
    }
  }, [getCrosschainVerifiedAssets, fetchingCrosschainAssets, crosschainSwapsEnabled]);

  useEffect(() => {
    const doSearch = async () => {
      if ((searching && !wasSearching) || (searching && previousSearchQuery !== searchQuery) || searchChainId !== previousChainId) {
        if (searchChainId === ChainId.mainnet) {
          search();
          slowSearch();
        } else {
          await search();
          setLowLiquidityAssets([]);
          setHighLiquidityAssets([]);
          setLoading(false);
        }
      } else {
        clearSearch();
      }
    };
    doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching, searchQuery, searchChainId]);

  const { colors } = useTheme();

  const currencyList = useMemo(() => {
    const list = [];

    if (searching) {
      const importedAsset = importedAssets?.[0];
      let verifiedAssetsWithImport = verifiedAssets;
      let highLiquidityAssetsWithImport = highLiquidityAssets;
      let lowLiquidityAssetsWithoutImport = lowLiquidityAssets;
      const verifiedAddresses = verifiedAssets.map(({ uniqueId }) => uniqueId.toLowerCase());
      const highLiquidityAddresses = verifiedAssets.map(({ uniqueId }) => uniqueId.toLowerCase());
      // this conditional prevents the imported token from jumping
      // sections if verified/highliquidity search responds later
      // than the contract checker in getImportedAsset
      if (importedAsset && !isFavorite(importedAsset?.address)) {
        lowLiquidityAssetsWithoutImport = lowLiquidityAssets.filter(({ address }) => address.toLowerCase() !== importedAsset?.address);
        if (importedAsset?.isVerified && !verifiedAddresses.includes(importedAsset?.address.toLowerCase())) {
          verifiedAssetsWithImport = [importedAsset, ...verifiedAssets];
        } else {
          if (!highLiquidityAddresses.includes(importedAsset?.address.toLowerCase())) {
            highLiquidityAssetsWithImport = [importedAsset, ...highLiquidityAssets];
          }
        }
      }

      if (favoriteAssets?.length && searchChainId === ChainId.mainnet) {
        list.push({
          color: colors.yellowFavorite,
          data: abcSort(favoriteAssets, 'name'),
          key: 'favorites',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.favoriteTokenSection}`),
        });
      }
      if (verifiedAssetsWithImport?.length) {
        list.push({
          data: verifiedAssetsWithImport,
          key: 'verified',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.verifiedTokenSection}`),
          useGradientText: !IS_TEST,
        });
      }
      if (highLiquidityAssetsWithImport?.length) {
        list.push({
          data: highLiquidityAssetsWithImport,
          key: 'highLiquidity',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.unverifiedTokenSection}`),
        });
      }
      if (lowLiquidityAssetsWithoutImport?.length) {
        list.push({
          data: lowLiquidityAssetsWithoutImport,
          key: 'lowLiquidity',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.lowLiquidityTokenSection}`),
        });
      }
    } else {
      const curatedAssets = searchChainId === ChainId.mainnet && getCurated();

      if (unfilteredFavorites?.length) {
        list.push({
          color: colors.yellowFavorite,
          data: abcSort(unfilteredFavorites, 'name'),
          key: 'unfilteredFavorites',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.favoriteTokenSection}`),
        });
      }
      if (curatedAssets && curatedAssets.length) {
        list.push({
          data: curatedAssets,
          key: 'curated',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.verifiedTokenSection}`),
          useGradientText: !IS_TEST,
        });
      }
    }
    return list;
  }, [
    verifiedAssets,
    searching,
    importedAssets,
    highLiquidityAssets,
    lowLiquidityAssets,
    isFavorite,
    favoriteAssets,
    searchChainId,
    colors.yellowFavorite,
    getCurated,
    unfilteredFavorites,
  ]);

  const crosschainExactMatches = useMemo(() => {
    if (currencyList.length) return [];
    if (!searchQuery) return [];
    const exactMatches: RainbowToken[] = [];
    Object.keys(crosschainVerifiedAssets).forEach(chainId => {
      const currentNetworkChainId = Number(chainId);
      if (currentNetworkChainId !== searchChainId) {
        // including goerli in our networks type is causing this type issue
        const exactMatch = crosschainVerifiedAssets[currentNetworkChainId].find((asset: RainbowToken) => {
          const symbolMatch = isLowerCaseMatch(asset?.symbol, searchQuery);
          const nameMatch = isLowerCaseMatch(asset?.name, searchQuery);
          return symbolMatch || nameMatch;
        });
        if (exactMatch) {
          exactMatches.push({ ...exactMatch, chainId: currentNetworkChainId });
        }
      }
    });
    if (exactMatches?.length) {
      return [
        {
          data: exactMatches,
          key: 'verified',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.crosschainMatchSection}`),
          useGradientText: !IS_TEST,
        },
      ];
    }
    return [];
  }, [crosschainVerifiedAssets, currencyList.length, searchChainId, searchQuery]);

  return {
    crosschainExactMatches,
    swapCurrencyList: currencyList,
    swapCurrencyListLoading: loading,
  };
};

export default useSearchCurrencyList;
