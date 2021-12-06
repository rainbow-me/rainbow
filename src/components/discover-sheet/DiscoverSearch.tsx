import { toLower } from 'lodash';
import { rankings } from 'match-sorter';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager, View } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { addHexPrefix } from '../../handlers/web3';
import CurrencySelectionTypes from '../../helpers/currencySelectionTypes';
import tokenSectionTypes from '../../helpers/tokenSectionTypes';
import { emitAssetRequest } from '../../redux/explorer';
import deviceUtils from '../../utils/deviceUtils';
import { CurrencySelectionList } from '../exchange';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../expanded-state/asset/ChartExpandedState... Remove this comment to see the full error message
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import { Row } from '../layout';
import DiscoverSheetContext from './DiscoverSheetContext';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/ens' or i... Remove this comment to see the full error message
import { fetchSuggestions } from '@rainbow-me/handlers/ens';
import {
  useAccountAssets,
  useTimeout,
  useUniswapAssets,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { filterList } from '@rainbow-me/utils';

export const SearchContainer = styled(Row)`
  height: 100%;
`;

const searchCurrencyList = (searchList = [], query: any) => {
  const isAddress = query.match(/^(0x)?[0-9a-fA-F]{40}$/);

  if (isAddress) {
    const formattedQuery = toLower(addHexPrefix(query));
    return filterList(searchList, formattedQuery, ['address'], {
      threshold: rankings.CASE_SENSITIVE_EQUAL,
    });
  }
  return filterList(searchList, query, ['symbol', 'name'], {
    threshold: rankings.CONTAINS,
  });
};

export default function DiscoverSearch() {
  const { navigate } = useNavigation();
  const { allAssets } = useAccountAssets();
  const dispatch = useDispatch();
  const {
    curatedNotFavorited,
    favorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    globalVerifiedAssets,
    loadingAllTokens,
  } = useUniswapAssets();
  const {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'isFetchingEns' does not exist on type 'n... Remove this comment to see the full error message
    isFetchingEns,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'setIsSearching' does not exist on type '... Remove this comment to see the full error message
    setIsSearching,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'setIsFetchingEns' does not exist on type... Remove this comment to see the full error message
    setIsFetchingEns,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'searchQuery' does not exist on type 'nul... Remove this comment to see the full error message
    searchQuery,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'isSearchModeEnabled' does not exist on t... Remove this comment to see the full error message
    isSearchModeEnabled,
  } = useContext(DiscoverSheetContext);

  const currencySelectionListRef = useRef();
  const [searchQueryForSearch, setSearchQueryForSearch] = useState('');
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const [startQueryDebounce, stopQueryDebounce] = useTimeout();
  const [fastCurrencyList, setFastCurrencyList] = useState([]);
  const [lowCurrencyList, setLowCurrencyList] = useState([]);
  const [ensResults, setEnsResults] = useState([]);

  const currencyList = useMemo(
    () => [...fastCurrencyList, ...lowCurrencyList, ...ensResults],
    [fastCurrencyList, lowCurrencyList, ensResults]
  );

  const handlePress = useCallback(
    item => {
      if (item.ens) {
        // navigate to Showcase sheet
        InteractionManager.runAfterInteractions(() => {
          navigate(Routes.SHOWCASE_SHEET, {
            address: item.nickname,
          });
        });
      } else {
        const asset = allAssets.find(
          (asset: any) => item.address === asset.address
        );
        dispatch(emitAssetRequest(item.address));
        navigate(Routes.EXPANDED_ASSET_SHEET, {
          asset: asset || item,
          longFormHeight: initialChartExpandedStateSheetHeight,
          type: 'token',
        });
      }
    },
    [allAssets, dispatch, navigate]
  );

  const handleActionAsset = useCallback(
    item => {
      navigate(Routes.ADD_TOKEN_SHEET, { item });
    },
    [navigate]
  );

  const itemProps = useMemo(
    () => ({
      onActionAsset: handleActionAsset,
      onPress: handlePress,
      showAddButton: true,
      showBalance: false,
    }),
    [handleActionAsset, handlePress]
  );

  const searchInFilteredLow = useCallback(
    searchQueryForSearch => {
      setTimeout(() => {
        const filteredLow = searchCurrencyList(
          globalLowLiquidityAssets,
          searchQueryForSearch
        );
        let lowCurrencyList: any = [];
        if (filteredLow.length) {
          lowCurrencyList = [
            {
              data: filteredLow,
              title: tokenSectionTypes.lowLiquidityTokenSection,
            },
          ];
        }
        setLowCurrencyList(lowCurrencyList);
      }, 0);
    },
    [globalLowLiquidityAssets]
  );

  const addEnsResults = useCallback(ensResults => {
    let ensSearchResults: any = [];
    if (ensResults && ensResults.length) {
      ensSearchResults = [
        {
          color: '#5893ff',
          data: ensResults,
          key: '􀏼 Ethereum Name Service',
          title: '􀏼 Ethereum Name Service',
        },
      ];
    }
    setEnsResults(ensSearchResults);
  }, []);

  const filterCurrencyList = useCallback(
    searchQueryForSearch => {
      let filteredList = [];
      if (searchQueryForSearch) {
        const filteredFavorite = searchCurrencyList(
          favorites,
          searchQueryForSearch
        );
        const filteredVerified = searchCurrencyList(
          globalVerifiedAssets,
          searchQueryForSearch
        );
        const filteredHighUnverified = searchCurrencyList(
          globalHighLiquidityAssets,
          searchQueryForSearch
        );

        filteredList = [];
        filteredFavorite.length &&
          filteredList.push({
            color: colors.yellowFavorite,
            data: filteredFavorite,
            title: tokenSectionTypes.favoriteTokenSection,
          });

        filteredVerified.length &&
          filteredList.push({
            data: filteredVerified,
            title: tokenSectionTypes.verifiedTokenSection,
            useGradientText: IS_TESTING === 'true' ? false : true,
          });

        filteredHighUnverified.length &&
          filteredList.push({
            data: filteredHighUnverified,
            title: tokenSectionTypes.unverifiedTokenSection,
          });
        searchInFilteredLow(searchQueryForSearch);
      } else {
        filteredList = [
          {
            color: colors.yellowFavorite,
            data: favorites,
            title: tokenSectionTypes.favoriteTokenSection,
          },
          {
            data: curatedNotFavorited,
            title: tokenSectionTypes.verifiedTokenSection,
            useGradientText: IS_TESTING === 'true' ? false : true,
          },
        ];
      }
      setIsSearching(false);
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '({ color: any; data: any; title:... Remove this comment to see the full error message
      setFastCurrencyList(filteredList);
    },
    [
      setIsSearching,
      favorites,
      globalVerifiedAssets,
      globalHighLiquidityAssets,
      colors.yellowFavorite,
      curatedNotFavorited,
      searchInFilteredLow,
    ]
  );

  useEffect(() => {
    stopQueryDebounce();
    startQueryDebounce(
      () => {
        setIsSearching(true);
        setSearchQueryForSearch(searchQuery);
        fetchSuggestions(searchQuery, addEnsResults, setIsFetchingEns);
        filterCurrencyList(searchQuery);
      },
      searchQuery === '' ? 1 : 500
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, setIsSearching, startQueryDebounce, stopQueryDebounce]);

  useEffect(() => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'scrollToLocation' does not exist on type... Remove this comment to see the full error message
    currencySelectionListRef.current?.scrollToLocation({
      animated: false,
      itemIndex: 0,
      sectionIndex: 0,
      viewOffset: 0,
      viewPosition: 0,
    });
  }, [isSearchModeEnabled]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View style={[!android && { height: deviceUtils.dimensions.height - 140 }]}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SearchContainer>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CurrencySelectionList
          footerSpacer
          itemProps={itemProps}
          keyboardDismissMode="on-drag"
          listItems={currencyList}
          loading={loadingAllTokens || isFetchingEns}
          query={searchQueryForSearch}
          ref={currencySelectionListRef}
          showList
          testID="discover-currency-select-list"
          type={CurrencySelectionTypes.output}
        />
      </SearchContainer>
    </View>
  );
}
