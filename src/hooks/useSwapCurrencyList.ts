import lang from 'i18n-js';
import { getAddress, isAddress } from '@ethersproject/address';
import { EthereumAddress } from '@rainbow-me/swaps';
import { Contract } from '@ethersproject/contracts';
import { rankings } from 'match-sorter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import usePrevious from './usePrevious';
import { RainbowToken, TokenSearchTokenListId } from '@/entities';
import { swapSearch } from '@/handlers/tokenSearch';
import { addHexPrefix, getProvider } from '@/handlers/web3';
import tokenSectionTypes from '@/helpers/tokenSectionTypes';
import { DAI_ADDRESS, erc20ABI, ETH_ADDRESS, rainbowTokenList, USDC_ADDRESS, WBTC_ADDRESS, WETH_ADDRESS } from '@/references';
import { ethereumUtils, filterList, isLowerCaseMatch } from '@/utils';
import useSwapCurrencies from '@/hooks/useSwapCurrencies';
import { CROSSCHAIN_SWAPS, useExperimentalFlag } from '@/config';
import { IS_TEST } from '@/env';
import { useFavorites } from '@/resources/favorites';
import { getUniqueId } from '@/utils/ethereumUtils';
import { ChainId } from '@/__swaps__/types/chains';
import { logger } from '@/logger';
import { Network } from '@/networks/types';

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
  fromChainId?: number | '';
  searchList: RainbowToken[] | TokenSearchTokenListId;
  query: string;
}) => {
  const { searchList, query, chainId, fromChainId } = searchParams;
  const isAddress = query.match(/^(0x)?[0-9a-fA-F]{40}$/);
  const keys: (keyof RainbowToken)[] = isAddress ? ['address'] : ['symbol', 'name'];
  const formattedQuery = isAddress ? addHexPrefix(query).toLowerCase() : query;
  if (typeof searchList === 'string') {
    const threshold = isAddress ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS';
    if (chainId === ChainId.mainnet && !formattedQuery && searchList !== 'verifiedAssets') {
      return [];
    }
    return swapSearch({
      chainId,
      fromChainId,
      keys,
      list: searchList,
      threshold,
      query: formattedQuery,
    });
  } else {
    return filterList(searchList, formattedQuery, keys, {
      threshold: isAddress ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
    });
  }
};

const useSwapCurrencyList = (searchQuery: string, searchChainId = ChainId.mainnet, isDiscover = false) => {
  const previousChainId = usePrevious(searchChainId);

  const searching = useMemo(() => searchQuery !== '' || ChainId.mainnet !== searchChainId, [searchChainId, searchQuery]);

  const { favorites: favoriteAddresses, favoritesMetadata: favoriteMap } = useFavorites();

  const curatedMap = rainbowTokenList.CURATED_TOKENS;
  const unfilteredFavorites = Object.values(favoriteMap);

  const [loading, setLoading] = useState(true);
  const [favoriteAssets, setFavoriteAssets] = useState<RainbowToken[]>([]);
  const [importedAssets, setImportedAssets] = useState<RainbowToken[]>([]);
  const [highLiquidityAssets, setHighLiquidityAssets] = useState<RainbowToken[]>([]);
  const [lowLiquidityAssets, setLowLiquidityAssets] = useState<RainbowToken[]>([]);
  const [verifiedAssets, setVerifiedAssets] = useState<RainbowToken[]>([]);
  const [fetchingCrosschainAssets, setFetchingCrosschainAssets] = useState(false);
  const [crosschainVerifiedAssets, setCrosschainVerifiedAssets] = useState<CrosschainVerifiedAssets>({
    [ChainId.mainnet]: [],
    [ChainId.optimism]: [],
    [ChainId.polygon]: [],
    [ChainId.bsc]: [],
    [ChainId.arbitrum]: [],
  });

  const crosschainSwapsEnabled = useExperimentalFlag(CROSSCHAIN_SWAPS);
  const { inputCurrency } = useSwapCurrencies();
  const previousInputCurrencyChainId = usePrevious(inputCurrency?.chainId);
  const inputChainId = inputCurrency?.chainId;
  const isCrosschainSearch = useMemo(() => {
    if (inputChainId && inputChainId !== searchChainId && crosschainSwapsEnabled && !isDiscover) {
      return true;
    }
  }, [inputChainId, searchChainId, crosschainSwapsEnabled, isDiscover]);

  const isFavorite = useCallback(
    (address: EthereumAddress) => favoriteAddresses.map(a => a?.toLowerCase()).includes(address?.toLowerCase()),
    [favoriteAddresses]
  );
  const handleSearchResponse = useCallback(
    (tokens: RainbowToken[], chainId?: ChainId) => {
      // These transformations are necessary for L2 tokens to match our spec
      const activeChainId = chainId ? chainId : searchChainId;
      return (tokens || [])
        .map(token => {
          token.address = token.networks?.[activeChainId]?.address || token.address;

          token.chainId = activeChainId;
          if (token.networks[ChainId.mainnet]) {
            token.mainnet_address = token.networks[ChainId.mainnet].address;
          }
          token.uniqueId = getUniqueId(token.address, activeChainId);

          return token;
        })
        .filter(({ address }) => !isFavorite(address));
    },
    [searchChainId, isFavorite]
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
      })
      .map(token => {
        return {
          ...token,
          network: Network.mainnet,
          chainId: ChainId.mainnet,
          uniqueId: getUniqueId(token.address, ChainId.mainnet),
        };
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
                address,
                chainId,
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
                network: ethereumUtils.getNetworkFromChainId(chainId),
                uniqueId,
              } as RainbowToken,
            ];
          } catch (e) {
            logger.warn('[useSwapCurrencyList]: error getting token data', { error: (e as Error).message });
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
      const fromChainId = inputChainId !== chainId ? inputChainId : '';
      const results = await searchCurrencyList({
        searchList: 'verifiedAssets',
        query: '',
        chainId,
        fromChainId,
      });
      setCrosschainVerifiedAssets(state => ({
        ...state,
        [chainId]: handleSearchResponse(results, chainId),
      }));
    },
    [handleSearchResponse, inputChainId]
  );

  const getCrosschainVerifiedAssets = useCallback(async () => {
    const crosschainAssetRequests: Promise<void>[] = [];
    Object.keys(crosschainVerifiedAssets).forEach(chainIdKey => {
      crosschainAssetRequests.push(getCrosschainVerifiedAssetsForNetwork(Number(chainIdKey)));
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
                fromChainId: isCrosschainSearch && inputChainId,
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
                fromChainId: isCrosschainSearch && inputChainId,
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
                fromChainId: isCrosschainSearch && inputChainId,
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
    [getFavorites, getImportedAsset, handleSearchResponse, searchQuery, searchChainId, inputChainId, isCrosschainSearch]
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
    setFetchingCrosschainAssets(false);
  }, [inputChainId]);

  useEffect(() => {
    if (!fetchingCrosschainAssets && crosschainSwapsEnabled) {
      setFetchingCrosschainAssets(true);
      getCrosschainVerifiedAssets();
    }
  }, [getCrosschainVerifiedAssets, fetchingCrosschainAssets, crosschainSwapsEnabled]);

  useEffect(() => {
    const doSearch = async () => {
      if (
        (searching && !wasSearching) ||
        (searching && previousSearchQuery !== searchQuery) ||
        searchChainId !== previousChainId ||
        inputCurrency?.chainId !== previousInputCurrencyChainId
      ) {
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
  }, [searching, searchQuery, searchChainId, isCrosschainSearch, inputCurrency?.chainId]);

  const { colors } = useTheme();

  const currencyList = useMemo(() => {
    const list = [];
    let bridgeAsset = isCrosschainSearch
      ? verifiedAssets.find(asset => isLowerCaseMatch(asset?.name, inputCurrency?.name) && asset?.chainId !== inputCurrency?.chainId)
      : null;
    if (searching) {
      const importedAsset = importedAssets?.[0];
      let verifiedAssetsWithImport = verifiedAssets;
      let highLiquidityAssetsWithImport = highLiquidityAssets;
      let lowLiquidityAssetsWithoutImport = lowLiquidityAssets;
      const verifiedAddresses = verifiedAssets.map(({ address }) => address.toLowerCase());
      const highLiquidityAddresses = verifiedAssets.map(({ address }) => address.toLowerCase());
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
      if (inputCurrency?.name && verifiedAssets.length) {
        if (bridgeAsset) {
          list.push({
            color: colors.networkColors[bridgeAsset.chainId],
            data: [bridgeAsset],
            key: 'bridgeAsset',
            title: lang.t(`exchange.token_sections.${tokenSectionTypes.bridgeTokenSection}`),
          });
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
      if (inputCurrency?.name && isCrosschainSearch && curatedAssets) {
        bridgeAsset = curatedAssets.find(asset => asset?.name === inputCurrency?.name);
        if (bridgeAsset) {
          list.push({
            color: colors.networkColors[bridgeAsset.chainId],
            data: [bridgeAsset],
            key: 'bridgeAsset',
            title: lang.t(`exchange.token_sections.${tokenSectionTypes.bridgeTokenSection}`),
          });
        }
      }
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
    isCrosschainSearch,
    verifiedAssets,
    searching,
    inputCurrency?.name,
    inputCurrency?.chainId,
    importedAssets,
    highLiquidityAssets,
    lowLiquidityAssets,
    isFavorite,
    favoriteAssets,
    searchChainId,
    colors.networkColors,
    colors.yellowFavorite,
    getCurated,
    unfilteredFavorites,
  ]);

  const crosschainExactMatches = useMemo(() => {
    if (currencyList.length) return [];
    if (!searchQuery) return [];
    const exactMatches: RainbowToken[] = [];
    Object.keys(crosschainVerifiedAssets).forEach(chainIdKey => {
      const chainId = Number(chainIdKey);
      if (chainId !== searchChainId) {
        // including goerli in our networks type is causing this type issue
        // @ts-ignore
        const exactMatch = crosschainVerifiedAssets[chainId].find((asset: RainbowToken) => {
          const symbolMatch = isLowerCaseMatch(asset?.symbol, searchQuery);
          const nameMatch = isLowerCaseMatch(asset?.name, searchQuery);
          return symbolMatch || nameMatch;
        });
        if (exactMatch) {
          exactMatches.push({ ...exactMatch, chainId });
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

export default useSwapCurrencyList;
