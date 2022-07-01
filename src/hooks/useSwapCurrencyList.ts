import { isAddress } from '@ethersproject/address';
import { ChainId, EthereumAddress } from '@rainbow-me/swaps';
import { Contract, ethers } from 'ethers';
import { rankings } from 'match-sorter';
import { useCallback, useEffect, useMemo, useState } from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
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
} from '@rainbow-me/entities';
import tokenSearch from '@rainbow-me/handlers/tokenSearch';
import { addHexPrefix, getProviderForNetwork } from '@rainbow-me/handlers/web3';
import tokenSectionTypes from '@rainbow-me/helpers/tokenSectionTypes';
import { erc20ABI, rainbowTokenList } from '@rainbow-me/references';
import { ethereumUtils, filterList, logger } from '@rainbow-me/utils';

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

const searchCurrencyList = async (
  searchList: RT[] | TokenSearchTokenListId,
  query: string,
  chainId: number
) => {
  const isAddress = query.match(/^(0x)?[0-9a-fA-F]{40}$/);
  const keys: (keyof RT)[] = isAddress ? ['address'] : ['symbol', 'name'];
  const formattedQuery = isAddress ? addHexPrefix(query).toLowerCase() : query;
  if (typeof searchList === 'string') {
    const threshold = isAddress ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS';
    if (chainId === MAINNET_CHAINID && !formattedQuery) {
      return [];
    }
    return tokenSearch(searchList, formattedQuery, chainId, keys, threshold);
  } else {
    return filterList(searchList, formattedQuery, keys, {
      threshold: isAddress ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
    });
  }
};

const useSwapCurrencyList = (
  searchQuery: string,
  chainId = MAINNET_CHAINID
) => {
  const previousChainId = usePrevious(chainId);

  const searching = useMemo(
    () => searchQuery !== '' || MAINNET_CHAINID !== chainId,
    [chainId, searchQuery]
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
      return tokens
        .map(token => {
          token.address = token.networks?.[chainId]?.address || token.address;
          if (chainId !== MAINNET_CHAINID) {
            const network = ethereumUtils.getNetworkFromChainId(chainId);
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
    [chainId, isFavorite]
  );

  const getCurated = useCallback(() => {
    const addresses = favoriteAddresses.map(a => a.toLowerCase());
    return Object.values(curatedMap).filter(
      ({ address }) => !addresses.includes(address.toLowerCase())
    );
  }, [curatedMap, favoriteAddresses]);

  const getFavorites = useCallback(async () => {
    return searching
      ? await searchCurrencyList(unfilteredFavorites, searchQuery, chainId)
      : unfilteredFavorites;
  }, [chainId, searchQuery, searching, unfilteredFavorites]);

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
              await searchCurrencyList(assetType, searchQuery, chainId)
            )
          );
          break;
        case 'highLiquidityAssets':
          setHighLiquidityAssets(
            handleSearchResponse(
              await searchCurrencyList(assetType, searchQuery, chainId)
            )
          );
          break;
        case 'lowLiquidityAssets':
          setLowLiquidityAssets(
            handleSearchResponse(
              await searchCurrencyList(assetType, searchQuery, chainId)
            )
          );
          break;
        case 'favoriteAssets':
          setFavoriteAssets((await getFavorites()) || []);
          break;
        case 'importedAssets': {
          const importedAssetResult = await getImportedAsset(
            searchQuery,
            chainId
          );
          if (importedAssetResult) {
            setImportedAssets(handleSearchResponse(importedAssetResult));
          }
          break;
        }
      }
    },
    [getFavorites, getImportedAsset, handleSearchResponse, searchQuery, chainId]
  );

  const search = useCallback(async () => {
    const categories: swapCurrencyListType[] =
      chainId === MAINNET_CHAINID
        ? [
            'favoriteAssets',
            'highLiquidityAssets',
            'verifiedAssets',
            'importedAssets',
          ]
        : ['verifiedAssets'];
    setLoading(true);
    await Promise.all(
      categories.map(assetType => getResultsForAssetType(assetType))
    );
  }, [chainId, getResultsForAssetType]);

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
        chainId !== previousChainId
      ) {
        if (chainId === MAINNET_CHAINID) {
          search();
          slowSearch();
        } else {
          await search();
          setLoading(false);
        }
      } else {
        clearSearch();
      }
    };
    doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching, searchQuery, chainId]);

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
            highLiquidityAddresses.includes(
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
      if (favoriteAssets?.length && chainId === MAINNET_CHAINID) {
        list.push({
          color: colors.yellowFavorite,
          data: favoriteAssets,
          key: 'favorites',
          title: tokenSectionTypes.favoriteTokenSection,
        });
      }
      if (verifiedAssets?.length) {
        list.push({
          data: verifiedAssetsWithImport,
          key: 'verified',
          title: tokenSectionTypes.verifiedTokenSection,
          useGradientText: IS_TESTING === 'true' ? false : true,
        });
      }
      if (highLiquidityAssets?.length) {
        list.push({
          data: highLiquidityAssetsWithImport,
          key: 'highLiquidity',
          title: tokenSectionTypes.unverifiedTokenSection,
        });
      }
      if (lowLiquidityAssets?.length) {
        list.push({
          data: lowLiquidityAssetsWithoutImport,
          key: 'lowLiqudiity',
          title: tokenSectionTypes.lowLiquidityTokenSection,
        });
      }
    } else {
      if (unfilteredFavorites?.length) {
        list.push({
          color: colors.yellowFavorite,
          data: unfilteredFavorites,
          key: 'unfilteredFavorites',
          title: tokenSectionTypes.favoriteTokenSection,
        });
      }
      if (chainId === MAINNET_CHAINID) {
        const curatedAssets = getCurated();
        if (curatedAssets.length) {
          list.push({
            data: curatedAssets,
            key: 'curated',
            title: tokenSectionTypes.verifiedTokenSection,
            useGradientText: IS_TESTING === 'true' ? false : true,
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
    chainId,
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
