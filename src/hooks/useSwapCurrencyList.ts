import { isAddress } from '@ethersproject/address';
import { ChainId, EthereumAddress } from '@rainbow-me/swaps';
import { Contract, ethers } from 'ethers';
import { rankings } from 'match-sorter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/store';
import { uniswapUpdateFavorites } from '../redux/uniswap';
import { useTheme } from '../theme/ThemeContext';
import usePrevious from './usePrevious';
import {
  AssetType,
  RainbowToken,
  RainbowToken as RT,
  TokenSearchTokenListId,
} from '@/entities';
import { tokenSearch } from '@/handlers/tokenSearch';
import { addHexPrefix, getProviderForNetwork } from '@/handlers/web3';
import tokenSectionTypes from '@/helpers/tokenSectionTypes';
import {
  DAI_ADDRESS,
  erc20ABI,
  ETH_ADDRESS,
  rainbowTokenList,
  USDC_ADDRESS,
  WBTC_ADDRESS,
  WETH_ADDRESS,
} from '@/references';
import { ethereumUtils, filterList, logger } from '@/utils';
import useSwapCurrencies from '@/hooks/useSwapCurrencies';
import { Network } from '@/helpers';
import { CROSSCHAIN_SWAPS, useExperimentalFlag } from '@/config';
import { IS_TEST } from '@/env';

const MAINNET_CHAINID = 1;
type swapCurrencyListType =
  | 'verifiedAssets'
  | 'highLiquidityAssets'
  | 'lowLiquidityAssets'
  | 'favoriteAssets'
  | 'curatedAssets'
  | 'importedAssets';
const uniswapCuratedTokensSelector = (state: AppState) => state.uniswap.pairs;
const uniswapFavoriteMetadataSelector = (state: AppState) =>
  state.uniswap.favoritesMeta;
const uniswapFavoritesSelector = (state: AppState): string[] =>
  state.uniswap.favorites;

const abcSort = (list: any[], key?: string) => {
  return list.sort((a, b) => {
    return key ? a[key]?.localeCompare(b[key]) : a?.localeCompare(b);
  });
};

const searchCurrencyList = async (searchParams: {
  chainId: number;
  fromChainId?: number | '';
  searchList: RT[] | TokenSearchTokenListId;
  query: string;
}) => {
  const { searchList, query, chainId, fromChainId } = searchParams;
  const isAddress = query.match(/^(0x)?[0-9a-fA-F]{40}$/);
  const keys: (keyof RT)[] = isAddress ? ['address'] : ['symbol', 'name'];
  const formattedQuery = isAddress ? addHexPrefix(query).toLowerCase() : query;
  if (typeof searchList === 'string') {
    const threshold = isAddress ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS';
    if (chainId === MAINNET_CHAINID && !formattedQuery) {
      return [];
    }
    return tokenSearch({
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

const useSwapCurrencyList = (
  searchQuery: string,
  searchChainId = MAINNET_CHAINID
) => {
  const previousChainId = usePrevious(searchChainId);

  const searching = useMemo(
    () => searchQuery !== '' || MAINNET_CHAINID !== searchChainId,
    [searchChainId, searchQuery]
  );
  const dispatch = useDispatch();

  const curatedMap = useSelector(uniswapCuratedTokensSelector);
  const favoriteMap = useSelector(uniswapFavoriteMetadataSelector);
  const unfilteredFavorites = Object.values(favoriteMap);
  const favoriteAddresses = useSelector(uniswapFavoritesSelector);

  const [loading, setLoading] = useState(true);
  const [favoriteAssets, setFavoriteAssets] = useState<RT[]>([]);
  const [importedAssets, setImportedAssets] = useState<RT[]>([]);
  const [highLiquidityAssets, setHighLiquidityAssets] = useState<RT[]>([]);
  const [lowLiquidityAssets, setLowLiquidityAssets] = useState<RT[]>([]);
  const [verifiedAssets, setVerifiedAssets] = useState<RT[]>([]);

  const { inputCurrency } = useSwapCurrencies();
  const crosschainSwapsEnabled = useExperimentalFlag(CROSSCHAIN_SWAPS);
  const inputChainId = useMemo(
    () =>
      inputCurrency?.network &&
      ethereumUtils.getChainIdFromNetwork(inputCurrency?.network as Network),
    [inputCurrency?.network]
  );
  const isCrosschainSearch = useMemo(() => {
    if (
      inputChainId &&
      inputChainId !== searchChainId &&
      crosschainSwapsEnabled
    ) {
      return true;
    }
  }, [searchChainId, inputChainId, crosschainSwapsEnabled]);

  const isFavorite = useCallback(
    (address: EthereumAddress) =>
      favoriteAddresses
        .map(a => a.toLowerCase())
        .includes(address.toLowerCase()),
    [favoriteAddresses]
  );
  const handleSearchResponse = useCallback(
    (tokens: RT[]) => {
      // These transformations are necessary for L2 tokens to match our spec
      return (tokens || [])
        .map(token => {
          token.address =
            token.networks?.[searchChainId]?.address || token.address;
          if (searchChainId !== MAINNET_CHAINID) {
            const network = ethereumUtils.getNetworkFromChainId(searchChainId);
            token.type = network;
            if (token.networks[MAINNET_CHAINID]) {
              token.mainnet_address = token.networks[MAINNET_CHAINID].address;
            }
            token.uniqueId = `${token.address}_${network}`;
          }
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
        const mainnetPriorityTokens = [
          ETH_ADDRESS,
          WETH_ADDRESS,
          DAI_ADDRESS,
          USDC_ADDRESS,
          WBTC_ADDRESS,
        ];
        const rankA = mainnetPriorityTokens.findIndex(
          address => address === address1.toLowerCase()
        );
        const rankB = mainnetPriorityTokens.findIndex(
          address => address === address2.toLowerCase()
        );
        const aIsRanked = rankA > -1;
        const bIsRanked = rankB > -1;
        if (aIsRanked) {
          return bIsRanked
            ? // compare rank within list
              rankA < rankB
              ? -1
              : 1
            : // only t1 is ranked
              -1;
        } else {
          return bIsRanked
            ? // only t2 is ranked
              1
            : // sort unranked by abc
              name1?.localeCompare(name2);
        }
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
    async (searchQuery, chainId): Promise<RT[] | null> => {
      if (searching) {
        if (isAddress(searchQuery)) {
          const tokenListEntry =
            rainbowTokenList.RAINBOW_TOKEN_LIST[searchQuery.toLowerCase()];
          if (tokenListEntry) {
            return [tokenListEntry];
          }
          const network = ethereumUtils.getNetworkFromChainId(chainId);
          const provider = await getProviderForNetwork(network);
          const tokenContract = new Contract(searchQuery, erc20ABI, provider);
          try {
            const [name, symbol, decimals, address] = await Promise.all([
              tokenContract.name(),
              tokenContract.symbol(),
              tokenContract.decimals(),
              ethers.utils.getAddress(searchQuery),
            ]);
            const uniqueId =
              chainId === ChainId.mainnet ? address : `${address}_${network}`;
            const type =
              chainId === ChainId.mainnet ? AssetType.token : network;
            return [
              {
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
                type,
                uniqueId,
              } as RainbowToken,
            ];
          } catch (e) {
            logger.log('error getting token data');
            logger.log(e);
            return null;
          }
        }
      }
      return null;
    },
    [searching]
  );

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
          const importedAssetResult = await getImportedAsset(
            searchQuery,
            searchChainId
          );
          if (importedAssetResult) {
            setImportedAssets(handleSearchResponse(importedAssetResult));
          }
          break;
        }
      }
    },
    [
      getFavorites,
      getImportedAsset,
      handleSearchResponse,
      searchQuery,
      searchChainId,
      inputChainId,
      isCrosschainSearch,
    ]
  );

  const search = useCallback(async () => {
    const categories: swapCurrencyListType[] =
      searchChainId === MAINNET_CHAINID
        ? [
            'favoriteAssets',
            'highLiquidityAssets',
            'verifiedAssets',
            'importedAssets',
          ]
        : ['verifiedAssets', 'importedAssets'];
    setLoading(true);
    await Promise.all(
      categories.map(assetType => getResultsForAssetType(assetType))
    );
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
    const doSearch = async () => {
      if (
        (searching && !wasSearching) ||
        (searching && previousSearchQuery !== searchQuery) ||
        searchChainId !== previousChainId
      ) {
        if (searchChainId === MAINNET_CHAINID) {
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
  }, [searching, searchQuery, searchChainId, isCrosschainSearch]);

  const { colors } = useTheme();

  const currencyList = useMemo(() => {
    const list = [];
    if (searching) {
      const importedAsset = importedAssets?.[0];
      let verifiedAssetsWithImport = verifiedAssets;
      let highLiquidityAssetsWithImport = highLiquidityAssets;
      let lowLiquidityAssetsWithoutImport = lowLiquidityAssets;
      const verifiedAddresses = verifiedAssets.map(({ address }) =>
        address.toLowerCase()
      );
      const highLiquidityAddresses = verifiedAssets.map(({ address }) =>
        address.toLowerCase()
      );
      // this conditional prevents the imported token from jumping
      // sections if verified/highliquidity search responds later
      // than the contract checker in getImportedAsset
      if (importedAsset && !isFavorite(importedAsset?.address)) {
        lowLiquidityAssetsWithoutImport = lowLiquidityAssets.filter(
          ({ address }) => address.toLowerCase() !== importedAsset?.address
        );
        if (
          importedAsset?.isVerified &&
          !verifiedAddresses.includes(importedAsset?.address.toLowerCase())
        ) {
          verifiedAssetsWithImport = [importedAsset, ...verifiedAssets];
        } else {
          if (
            !highLiquidityAddresses.includes(
              importedAsset?.address.toLowerCase()
            )
          ) {
            highLiquidityAssetsWithImport = [
              importedAsset,
              ...highLiquidityAssets,
            ];
          }
        }
      }
      if (favoriteAssets?.length && searchChainId === MAINNET_CHAINID) {
        list.push({
          color: colors.yellowFavorite,
          data: abcSort(favoriteAssets, 'name'),
          key: 'favorites',
          title: tokenSectionTypes.favoriteTokenSection,
        });
      }
      if (verifiedAssetsWithImport?.length) {
        list.push({
          data: verifiedAssetsWithImport,
          key: 'verified',
          title: tokenSectionTypes.verifiedTokenSection,
          useGradientText: !IS_TEST,
        });
      }
      if (highLiquidityAssetsWithImport?.length) {
        list.push({
          data: highLiquidityAssetsWithImport,
          key: 'highLiquidity',
          title: tokenSectionTypes.unverifiedTokenSection,
        });
      }
      if (lowLiquidityAssetsWithoutImport?.length) {
        list.push({
          data: lowLiquidityAssetsWithoutImport,
          key: 'lowLiquidity',
          title: tokenSectionTypes.lowLiquidityTokenSection,
        });
      }
    } else {
      if (unfilteredFavorites?.length) {
        list.push({
          color: colors.yellowFavorite,
          data: abcSort(unfilteredFavorites, 'name'),
          key: 'unfilteredFavorites',
          title: tokenSectionTypes.favoriteTokenSection,
        });
      }
      if (searchChainId === MAINNET_CHAINID) {
        const curatedAssets = getCurated();
        if (curatedAssets.length) {
          list.push({
            data: curatedAssets,
            key: 'curated',
            title: tokenSectionTypes.verifiedTokenSection,
            useGradientText: !IS_TEST,
          });
        }
      }
    }
    return list;
  }, [
    searching,
    importedAssets,
    favoriteAssets,
    verifiedAssets,
    highLiquidityAssets,
    lowLiquidityAssets,
    colors.yellowFavorite,
    unfilteredFavorites,
    searchChainId,
    getCurated,
    isFavorite,
  ]);

  const updateFavorites = useCallback(
    (...data: [string | string[], boolean]) =>
      dispatch(uniswapUpdateFavorites(...data)),
    [dispatch]
  );

  return {
    swapCurrencyList: currencyList,
    swapCurrencyListLoading: loading,
    updateFavorites,
  };
};

export default useSwapCurrencyList;
