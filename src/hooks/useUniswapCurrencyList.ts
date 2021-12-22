import { filter, forEach, map, toLower, values } from 'lodash';
import { rankings } from 'match-sorter';
import { useCallback, useEffect, useState } from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { AppState } from '../redux/store';
import { uniswapUpdateFavorites } from '../redux/uniswap';
import {
  RainbowToken as RT,
  TokenSearchTokenListId,
} from '@rainbow-me/entities';
import { getUniswapV2Tokens } from '@rainbow-me/handlers/dispersion';
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
const uniswapFavoritesSelector = (state: AppState): string[] =>
  state.uniswap.favorites;

const searchCurrencyList = async (
  searchList: RT[] | TokenSearchTokenListId,
  query: string
) => {
  const isAddress = query.match(/^(0x)?[0-9a-fA-F]{40}$/);
  const keys: (keyof RT)[] = isAddress ? ['address'] : ['symbol', 'name'];
  const formattedQuery = isAddress ? toLower(addHexPrefix(query)) : query;
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
  const [loading, setLoading] = useState(true);
  const [curatedAssets, setCuratedAssets] = useState<RT[]>([]);
  const [favoriteAssets, setFavoriteAssets] = useState<RT[]>([]);
  const [highLiquidityAssets, setHighLiquidityAssets] = useState<RT[]>([]);
  const [lowLiquidityAssets, setLowLiquidityAssets] = useState<RT[]>([]);
  const [unfilteredFavorites, setUnfilteredFavorites] = useState<RT[]>([]);
  const [verifiedAssets, setVerifiedAssets] = useState<RT[]>([]);

  const curatedMap = useSelector(uniswapCuratedTokensSelector);
  const favoriteAddresses = useSelector(uniswapFavoritesSelector);

  useQuery(
    ['tokens/uniswap/v2', favoriteAddresses],
    () => getUniswapV2Tokens(map(favoriteAddresses, toLower)),
    {
      onSuccess: res => setUnfilteredFavorites(res),
    }
  );

  const getCurated = () => {
    return filter(
      values(curatedMap),
      ({ address }) =>
        !map(favoriteAddresses, toLower).includes(toLower(address))
    );
  };
  const getFavorites = async () => {
    return searching
      ? await searchCurrencyList(unfilteredFavorites, searchQuery)
      : unfilteredFavorites;
  };

  const getResultsForAssetType = async (assetType: UniswapCurrencyListType) => {
    switch (assetType) {
      case 'verifiedAssets':
        setVerifiedAssets(await searchCurrencyList(assetType, searchQuery));
        break;
      case 'highLiquidityAssets':
        setHighLiquidityAssets(
          await searchCurrencyList(assetType, searchQuery)
        );
        break;
      case 'lowLiquidityAssets':
        setLowLiquidityAssets(await searchCurrencyList(assetType, searchQuery));
        break;
      case 'favoriteAssets':
        setFavoriteAssets((await getFavorites()) || []);
        break;
      case 'curatedAssets':
        setCuratedAssets(getCurated());
        break;
    }
  };

  const search = () => {
    const categories: UniswapCurrencyListType[] = [
      'favoriteAssets',
      'highLiquidityAssets',
      'verifiedAssets',
    ];
    setLoading(true);
    forEach(categories, assetType => getResultsForAssetType(assetType));
  };

  const slowSearch = async () => {
    await getResultsForAssetType('lowLiquidityAssets');
    setLoading(false);
  };

  const clearSearch = () => {
    getResultsForAssetType('curatedAssets');
    setLowLiquidityAssets([]);
    setHighLiquidityAssets([]);
    setVerifiedAssets([]);
  };

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
  const getCurrencyList = () => {
    const list = [];
    if (searching) {
      if (favoriteAssets.length) {
        list.push({
          color: colors.yellowFavorite,
          data: favoriteAssets,
          title: tokenSectionTypes.favoriteTokenSection,
        });
      }
      if (verifiedAssets.length) {
        list.push({
          data: verifiedAssets,
          title: tokenSectionTypes.verifiedTokenSection,
          useGradientText: IS_TESTING === 'true' ? false : true,
        });
      }
      if (highLiquidityAssets.length) {
        list.push({
          data: highLiquidityAssets,
          title: tokenSectionTypes.unverifiedTokenSection,
        });
      }
      if (lowLiquidityAssets?.length) {
        list.push({
          data: lowLiquidityAssets,
          title: tokenSectionTypes.lowLiquidityTokenSection,
        });
      }
    } else {
      if (unfilteredFavorites.length) {
        list.push({
          color: colors.yellowFavorite,
          data: unfilteredFavorites,
          title: tokenSectionTypes.favoriteTokenSection,
        });
        if (curatedAssets.length) {
          list.push({
            data: curatedAssets,
            title: tokenSectionTypes.verifiedTokenSection,
            useGradientText: IS_TESTING === 'true' ? false : true,
          });
        }
      }
    }
    return list;
  };

  const updateFavorites = useCallback(
    (...data) => dispatch(uniswapUpdateFavorites(...data)),
    [dispatch]
  );
  const currencyList = getCurrencyList();

  return {
    uniswapCurrencyList: currencyList,
    uniswapCurrencyListLoading: loading,
    updateFavorites,
  };
};

export default useUniswapCurrencyList;
