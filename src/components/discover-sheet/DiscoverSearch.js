import lang from 'i18n-js';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useDebounce } from 'use-debounce/lib';
import CurrencySelectionTypes from '../../helpers/currencySelectionTypes';
import { emitAssetRequest } from '../../redux/explorer';
import deviceUtils from '../../utils/deviceUtils';
import { CurrencySelectionList } from '../exchange';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import { Row } from '../layout';
import DiscoverSheetContext from './DiscoverSheetContext';
import { fetchSuggestions } from '@rainbow-me/handlers/ens';
import {
  useHardwareBackOnFocus,
  usePrevious,
  useSwapCurrencyList,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { ethereumUtils } from '@rainbow-me/utils';

export const SearchContainer = styled(Row)({
  height: '100%',
});

export default function DiscoverSearch() {
  const { navigate } = useNavigation();
  const dispatch = useDispatch();
  const {
    isSearching,
    isFetchingEns,
    setIsSearching,
    setIsFetchingEns,
    searchQuery,
    isSearchModeEnabled,
    setIsSearchModeEnabled,
    searchInputRef,
    cancelSearch,
  } = useContext(DiscoverSheetContext);

  const currencySelectionListRef = useRef();
  const [searchQueryForSearch] = useDebounce(searchQuery, 350);
  const [ensResults, setEnsResults] = useState([]);
  const { swapCurrencyList, uniswapCurrencyListLoading } = useSwapCurrencyList(
    searchQueryForSearch
  );
  const currencyList = useMemo(() => [...swapCurrencyList, ...ensResults], [
    swapCurrencyList,
    ensResults,
  ]);
  const lastSearchQuery = usePrevious(searchQueryForSearch);

  useHardwareBackOnFocus(() => {
    cancelSearch();
    // prevent other back handlers from firing
    return true;
  });

  const handlePress = useCallback(
    item => {
      if (item.ens) {
        // navigate to Showcase sheet
        searchInputRef?.current?.blur();
        InteractionManager.runAfterInteractions(() => {
          navigate(Routes.SHOWCASE_SHEET, {
            address: item.nickname,
            setIsSearchModeEnabled,
          });
        });
      } else {
        const asset = ethereumUtils.getAccountAsset(item.uniqueId);
        dispatch(emitAssetRequest(item.address));
        navigate(Routes.EXPANDED_ASSET_SHEET, {
          asset: asset || item,
          fromDiscover: true,
          longFormHeight: initialChartExpandedStateSheetHeight,
          type: 'token',
        });
      }
    },
    [dispatch, navigate, searchInputRef, setIsSearchModeEnabled]
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

  const addEnsResults = useCallback(ensResults => {
    let ensSearchResults = [];
    if (ensResults && ensResults.length) {
      ensSearchResults = [
        {
          color: '#5893ff',
          data: ensResults,
          key: `􀏼 ${lang.t('discover.search.ethereum_name_service')}`,
          title: `􀏼 ${lang.t('discover.search.ethereum_name_service')}`,
        },
      ];
    }
    setEnsResults(ensSearchResults);
  }, []);

  useEffect(() => {
    if (searchQueryForSearch && !isSearching) {
      if (lastSearchQuery !== searchQueryForSearch) {
        setIsSearching(true);
        fetchSuggestions(searchQuery, addEnsResults, setIsFetchingEns);
      }
    }
  }, [
    addEnsResults,
    isSearching,
    lastSearchQuery,
    searchQuery,
    searchQueryForSearch,
    setIsFetchingEns,
    setIsSearching,
  ]);

  useEffect(() => {
    if (!uniswapCurrencyListLoading && !isFetchingEns) {
      setIsSearching(false);
    }
  }, [isFetchingEns, setIsSearching, uniswapCurrencyListLoading]);

  useEffect(() => {
    currencySelectionListRef.current?.scrollToLocation({
      animated: false,
      itemIndex: 0,
      sectionIndex: 0,
      viewOffset: 0,
      viewPosition: 0,
    });
  }, [isSearchModeEnabled]);

  return (
    <View style={{ height: deviceUtils.dimensions.height - 140 }}>
      <SearchContainer>
        <CurrencySelectionList
          footerSpacer
          itemProps={itemProps}
          keyboardDismissMode="on-drag"
          listItems={currencyList}
          loading={uniswapCurrencyListLoading || isFetchingEns}
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
