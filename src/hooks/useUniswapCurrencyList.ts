import { rankings } from 'match-sorter';
import { useCallback, useEffect, useMemo, useState } from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/store';
import { uniswapUpdateFavorites } from '../redux/uniswap';
import { useTheme } from '../theme/ThemeContext';
import {
  RainbowToken as RT,
  TokenSearchTokenListId,
} from '@rainbow-me/entities';
import tokenSearch from '@rainbow-me/handlers/tokenSearch';
import { addHexPrefix } from '@rainbow-me/handlers/web3';
import tokenSectionTypes from '@rainbow-me/helpers/tokenSectionTypes';
import { filterList } from '@rainbow-me/utils';

type UniswapCurrencyListType =
  | 'verifiedAssets'
  | 'highLiquidityAssets'
  | 'lowLiquidityAssets'
  | 'favoriteAssets'
  | 'curatedAssets';
const uniswapCuratedTokensSelector = (state: AppState) => state.uniswap.pairs;
const uniswapFavoriteMetadataSelector = (state: AppState) =>
  state.uniswap.favoritesMeta;
const uniswapFavoritesSelector = (state: AppState): string[] =>
  state.uniswap.favorites;

const searchCurrencyList = async (
  searchList: RT[] | TokenSearchTokenListId,
  query: string
) => {
  const isAddress = query.match(/^(0x)?[0-9a-fA-F]{40}$/);
  const keys: (keyof RT)[] = isAddress ? ['address'] : ['symbol', 'name'];
  const formattedQuery = isAddress ? addHexPrefix(query).toLowerCase() : query;
  if (typeof searchList === 'string') {
    const threshold = isAddress ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS';
    return await tokenSearch(searchList, formattedQuery, keys, threshold);
  } else {
    return filterList(searchList, formattedQuery, keys, {
      threshold: isAddress ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
    });
  }
};

const useUniswapCurrencyList = (searchQuery: string) => {
  const searching = searchQuery !== '';
  const dispatch = useDispatch();

  const curatedMap = useSelector(uniswapCuratedTokensSelector);
  const favoriteMap = useSelector(uniswapFavoriteMetadataSelector);
  const unfilteredFavorites = Object.values(favoriteMap);
  const favoriteAddresses = useSelector(uniswapFavoritesSelector);

  const [loading, setLoading] = useState(true);
  const [favoriteAssets, setFavoriteAssets] = useState<RT[]>([]);
  const [highLiquidityAssets, setHighLiquidityAssets] = useState<RT[]>([]);
  const [lowLiquidityAssets, setLowLiquidityAssets] = useState<RT[]>([]);
  const [verifiedAssets, setVerifiedAssets] = useState<RT[]>([]);

  const handleVerifiedResponse = useCallback(
    (tokens: RT[]) => {
      const addresses = favoriteAddresses.map(a => a.toLowerCase());
      return tokens.filter(({ address }) => !addresses.includes(address));
    },
    [favoriteAddresses]
  );

  const getCurated = useCallback(() => {
    const addresses = favoriteAddresses.map(a => a.toLowerCase());
    return Object.values(curatedMap).filter(
      ({ address }) => !addresses.includes(address.toLowerCase())
    );
  }, [curatedMap, favoriteAddresses]);

  const getFavorites = useCallback(async () => {
    return searching
      ? await searchCurrencyList(unfilteredFavorites, searchQuery)
      : unfilteredFavorites;
  }, [searchQuery, searching, unfilteredFavorites]);

  const getResultsForAssetType = useCallback(
    async (assetType: UniswapCurrencyListType) => {
      switch (assetType) {
        case 'verifiedAssets':
          setVerifiedAssets(
            handleVerifiedResponse(
              await searchCurrencyList(assetType, searchQuery)
            )
          );
          break;
        case 'highLiquidityAssets':
          setHighLiquidityAssets(
            await searchCurrencyList(assetType, searchQuery)
          );
          break;
        case 'lowLiquidityAssets':
          setLowLiquidityAssets(
            await searchCurrencyList(assetType, searchQuery)
          );
          break;
        case 'favoriteAssets':
          setFavoriteAssets((await getFavorites()) || []);
          break;
      }
    },
    [getFavorites, handleVerifiedResponse, searchQuery]
  );

  const search = () => {
    const categories: UniswapCurrencyListType[] = [
      'favoriteAssets',
      'highLiquidityAssets',
      'verifiedAssets',
    ];
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
      slowSearch();
    } else {
      clearSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const { colors } = useTheme();

  const currencyList = useMemo(() => {
    const list = [];
    if (searching) {
      if (favoriteAssets.length) {
        list.push({
          color: colors.yellowFavorite,
          data: favoriteAssets,
          key: 'favorites',
          title: tokenSectionTypes.favoriteTokenSection,
        });
      }
      if (verifiedAssets.length) {
        list.push({
          data: verifiedAssets,
          key: 'verified',
          title: tokenSectionTypes.verifiedTokenSection,
          useGradientText: IS_TESTING === 'true' ? false : true,
        });
      }
      if (highLiquidityAssets.length) {
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
      if (unfilteredFavorites.length) {
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
    colors.yellowFavorite,
    favoriteAssets,
    highLiquidityAssets,
    lowLiquidityAssets,
    searching,
    unfilteredFavorites,
    verifiedAssets,
    getCurated,
  ]);

  const updateFavorites = useCallback(
    (...data: [string | string[], boolean]) =>
      dispatch(uniswapUpdateFavorites(...data)),
    [dispatch]
  );

  return {
    uniswapCurrencyList: currencyList,
    uniswapCurrencyListLoading: loading,
    updateFavorites,
  };
};

export default useUniswapCurrencyList;
