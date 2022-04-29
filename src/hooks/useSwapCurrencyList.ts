import { isAddress } from '@ethersproject/address';
import { Contract, ethers } from 'ethers';
import { rankings } from 'match-sorter';
import { useCallback, useEffect, useMemo, useState } from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { AppState } from '../redux/store';
import { uniswapUpdateFavorites } from '../redux/uniswap';
import {
  RainbowToken as RT,
  TokenSearchTokenListId,
} from '@rainbow-me/entities';
import tokenSearch from '@rainbow-me/handlers/tokenSearch';
import { addHexPrefix, web3Provider } from '@rainbow-me/handlers/web3';
import tokenSectionTypes from '@rainbow-me/helpers/tokenSectionTypes';
import { erc20ABI } from '@rainbow-me/references';
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
    return await tokenSearch(
      searchList,
      formattedQuery,
      chainId,
      keys,
      threshold
    );
  } else {
    return filterList(searchList, formattedQuery, keys, {
      threshold: isAddress ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
    });
  }
};

const useSwapCurrencyList = (searchQuery: string, chainId = 1) => {
  const searching = searchQuery !== '';
  const dispatch = useDispatch();

  const curatedMap = useSelector(uniswapCuratedTokensSelector);
  const favoriteMap = useSelector(uniswapFavoriteMetadataSelector);
  const unfilteredFavorites = Object.values(favoriteMap);
  const favoriteAddresses = useSelector(uniswapFavoritesSelector);

  const [loading, setLoading] = useState(true);
  const [favoriteAssets, setFavoriteAssets] = useState<RT[]>([]);
  const [importedAssets, setimportedAssets] = useState<RT[]>([]);
  const [highLiquidityAssets, setHighLiquidityAssets] = useState<RT[]>([]);
  const [lowLiquidityAssets, setLowLiquidityAssets] = useState<RT[]>([]);
  const [verifiedAssets, setVerifiedAssets] = useState<RT[]>([]);

  const handleVerifiedResponse = useCallback(
    (tokens: RT[]) => {
      const addresses = favoriteAddresses.map(a => a.toLowerCase());

      return tokens
        .map(token => {
          if (chainId !== 1) {
            const network = ethereumUtils.getNetworkFromChainId(chainId);
            token.type = network;
            if (token.networks[MAINNET_CHAINID]) {
              token.mainnet_address = token.networks[MAINNET_CHAINID].address;
            }
            token.address = token.networks[chainId].address;
          }
          return token;
        })
        .filter(({ address }) => !addresses.includes(address));
    },
    [chainId, favoriteAddresses]
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

  const getimportedAsset = useCallback(
    async searchQuery => {
      if (searching) {
        if (isAddress(searchQuery)) {
          const tokenContract = new Contract(
            searchQuery,
            erc20ABI,
            web3Provider
          );
          try {
            const [name, symbol, decimals, address] = await Promise.all([
              tokenContract.name(),
              tokenContract.symbol(),
              tokenContract.decimals(),
              ethers.utils.getAddress(searchQuery),
            ]);

            return [
              {
                address,
                decimals,
                favorite: false,
                highLiquidity: false,
                isRainbowCurated: false,
                isVerified: false,
                name,
                symbol,
                totalLiquidity: 0,
                uniqueId: address,
              },
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
            handleVerifiedResponse(
              await searchCurrencyList(assetType, searchQuery, chainId)
            )
          );
          break;
        case 'highLiquidityAssets':
          setHighLiquidityAssets(
            await searchCurrencyList(assetType, searchQuery, chainId)
          );
          break;
        case 'lowLiquidityAssets':
          setLowLiquidityAssets(
            await searchCurrencyList(assetType, searchQuery, chainId)
          );
          break;
        case 'favoriteAssets':
          setFavoriteAssets((await getFavorites()) || []);
          break;
        case 'importedAssets':
          // @ts-ignore
          setimportedAssets((await getimportedAsset(searchQuery)) || []);
          break;
      }
    },
    [
      getFavorites,
      getimportedAsset,
      handleVerifiedResponse,
      searchQuery,
      chainId,
    ]
  );

  const search = () => {
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
    categories.forEach(assetType => getResultsForAssetType(assetType));
  };

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
  }, [getResultsForAssetType]);

  useEffect(() => {
    if (searching) {
      search();
      if (chainId === MAINNET_CHAINID) {
        slowSearch();
      } else {
        setLoading(false);
      }
    } else {
      clearSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const { colors } = useTheme();

  const currencyList = useMemo(() => {
    const list = [];
    if (searching) {
      if (importedAssets?.length) {
        list.push({
          data: importedAssets,
          key: 'imported',
          title: tokenSectionTypes.importedTokenSection,
        });
      }
      if (favoriteAssets?.length) {
        list.push({
          color: colors.yellowFavorite,
          data: favoriteAssets,
          key: 'favorites',
          title: tokenSectionTypes.favoriteTokenSection,
        });
      }
      if (verifiedAssets?.length) {
        list.push({
          data: verifiedAssets,
          key: 'verified',
          title: tokenSectionTypes.verifiedTokenSection,
          useGradientText: IS_TESTING === 'true' ? false : true,
        });
      }
      if (highLiquidityAssets?.length) {
        list.push({
          data: highLiquidityAssets,
          key: 'highLiquidity',
          title: tokenSectionTypes.unverifiedTokenSection,
        });
      }
      if (lowLiquidityAssets?.length) {
        list.push({
          data: lowLiquidityAssets,
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
    getCurated,
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
