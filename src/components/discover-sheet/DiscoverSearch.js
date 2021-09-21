import { map, toLower } from 'lodash';
import * as matchSorter from 'match-sorter';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager, View } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { addHexPrefix } from '../../handlers/web3';
import CurrencySelectionTypes from '../../helpers/currencySelectionTypes';
import tokenSectionTypes from '../../helpers/tokenSectionTypes';
import { emitAssetRequest } from '../../redux/explorer';
import deviceUtils from '../../utils/deviceUtils';
import { CurrencySelectionList } from '../exchange';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import { Row } from '../layout';
import DiscoverSheetContext from './DiscoverSheetContext';
import { debouncedFetchSuggestions } from '@rainbow-me/handlers/ens';
import {
  useAccountAssets,
  useTimeout,
  useUniswapAssets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { filterList } from '@rainbow-me/utils';

export const SearchContainer = styled(Row)`
  height: 100%;
`;

const searchCurrencyList = (searchList = [], query) => {
  const isAddress = query.match(/^(0x)?[0-9a-fA-F]{40}$/);

  if (isAddress) {
    const formattedQuery = toLower(addHexPrefix(query));
    return filterList(searchList, formattedQuery, ['address'], {
      threshold: matchSorter.rankings.CASE_SENSITIVE_EQUAL,
    });
  }

  return filterList(searchList, query, ['symbol', 'name'], {
    threshold: matchSorter.rankings.CONTAINS,
  });
};

export default function DiscoverSearch() {
  const { navigate } = useNavigation();
  const { allAssets } = useAccountAssets();

  const {
    isFetchingEns,
    setIsSearching,
    setIsFetchingEns,
    searchQuery,
    isSearchModeEnabled,
  } = useContext(DiscoverSheetContext);

  const [searchQueryForSearch, setSearchQueryForSearch] = useState('');
  const dispatch = useDispatch();
  const {
    curatedNotFavorited,
    favorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    globalVerifiedAssets,
    loadingAllTokens,
  } = useUniswapAssets();
  const { colors } = useTheme();
  const [ensSearchResults, setEnsSearchResults] = useState(null);
  useEffect(() => {
    if (searchQuery && searchQuery?.length > 2) {
      debouncedFetchSuggestions(
        searchQuery,
        setEnsSearchResults,
        setIsFetchingEns
      );
    } else {
      setEnsSearchResults(null);
    }
  }, [searchQuery, setIsFetchingEns]);

  const currencyList = useMemo(() => {
    let filteredList = [];
    if (searchQueryForSearch) {
      const [
        filteredFavorite,
        filteredVerified,
        filteredHighUnverified,
        filteredLow,
      ] = map(
        [
          favorites,
          globalVerifiedAssets,
          globalHighLiquidityAssets,
          globalLowLiquidityAssets,
        ],
        section => searchCurrencyList(section, searchQueryForSearch)
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

      filteredLow.length &&
        filteredList.push({
          data: filteredLow,
          title: tokenSectionTypes.lowLiquidityTokenSection,
        });
      ensSearchResults?.length &&
        filteredList.push({
          color: '#5893ff',
          data: ensSearchResults,
          key: '􀏼 Ethereum Name Service',
          title: '􀏼 Ethereum Name Service',
        });
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
    return filteredList;
  }, [
    setIsSearching,
    searchQueryForSearch,
    favorites,
    globalVerifiedAssets,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    colors.yellowFavorite,
    ensSearchResults,
    curatedNotFavorited,
  ]);

  const [startQueryDebounce, stopQueryDebounce] = useTimeout();
  useEffect(() => {
    stopQueryDebounce();
    startQueryDebounce(
      () => {
        setIsSearching(true);
        setSearchQueryForSearch(searchQuery);
      },
      searchQuery === '' ? 1 : 500
    );
  }, [searchQuery, setIsSearching, startQueryDebounce, stopQueryDebounce]);

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
        const asset = allAssets.find(asset => item.address === asset.address);
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

  const ref = useRef();
  useEffect(() => {
    ref.current?.scrollToLocation({
      animated: false,
      itemIndex: 0,
      sectionIndex: 0,
      viewOffset: 0,
      viewPosition: 0,
    });
  }, [isSearchModeEnabled]);

  return (
    <View style={[!android && { height: deviceUtils.dimensions.height - 140 }]}>
      <SearchContainer>
        <CurrencySelectionList
          footerSpacer
          itemProps={itemProps}
          keyboardDismissMode="on-drag"
          listItems={currencyList}
          loading={loadingAllTokens || isFetchingEns}
          query={searchQueryForSearch}
          ref={ref}
          showList
          testID="discover-currency-select-list"
          type={CurrencySelectionTypes.output}
        />
      </SearchContainer>
    </View>
  );
}
