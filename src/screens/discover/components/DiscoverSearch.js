import lang from 'i18n-js';
import { uniqBy } from 'lodash';
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
import { useDebounce } from 'use-debounce/lib';
import CurrencySelectionTypes from '@/helpers/currencySelectionTypes';
import { emitAssetRequest } from '@/redux/explorer';
import deviceUtils from '@/utils/deviceUtils';
import { CurrencySelectionList } from '@/components/exchange';
import { Row } from '@/components/layout';
import DiscoverSheetContext from '../DiscoverScreenContext';
import { analytics } from '@/analytics';
import { PROFILES, useExperimentalFlag } from '@/config';
import { fetchSuggestions } from '@/handlers/ens';
import {
  useHardwareBackOnFocus,
  usePrevious,
  useSwapCurrencyList,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';
import { ethereumUtils } from '@/utils';
import { Network } from '@/helpers';
import {
  getPoapAndOpenSheetWithQRHash,
  getPoapAndOpenSheetWithSecretWord,
} from '@/utils/poaps';

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

  const { colors } = useTheme();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const currencySelectionListRef = useRef();
  const [searchQueryForSearch] = useDebounce(searchQuery, 350);
  const [ensResults, setEnsResults] = useState([]);
  const { swapCurrencyList, swapCurrencyListLoading } = useSwapCurrencyList(
    searchQueryForSearch,
    ethereumUtils.getChainIdFromNetwork(Network.mainnet),
    true
  );

  // we want to debounce the poap search further
  const [searchQueryForPoap] = useDebounce(searchQueryForSearch, 800);

  const currencyList = useMemo(() => {
    // order:
    // 1. favorites
    // 2. verified
    // 3. profiles
    // 4. unverified
    // 5. low liquidity
    let list = swapCurrencyList;
    const listKeys = swapCurrencyList.map(item => item.key);

    const profilesSecond =
      (listKeys[0] === 'favorites' && listKeys[1] !== 'verified') ||
      listKeys[0] === 'verified';
    const profilesThird =
      listKeys[1] === 'verified' ||
      listKeys[0] === 'unfilteredFavorites' ||
      (listKeys[0] === 'favorites' && listKeys[1] === 'verified');

    if (profilesSecond) {
      list.splice(1, 0, ...ensResults);
    } else if (profilesThird) {
      list.splice(2, 0, ...ensResults);
    } else {
      list = [...ensResults, ...swapCurrencyList];
    }

    // ONLY FOR e2e!!! Fake tokens with same symbols break detox e2e tests
    if (IS_TESTING === 'true') {
      let symbols = [];
      list = list?.map(section => {
        // Remove dupes
        section.data = uniqBy(section?.data, 'symbol');
        // Remove dupes across sections
        section.data = section?.data?.filter(
          token => !symbols.includes(token?.symbol)
        );
        const sectionSymbols = section?.data?.map(token => token?.symbol);
        symbols = symbols.concat(sectionSymbols);

        return section;
      });

      list = list.map((section, index) => ({
        ...section,
        key: `${section.key}-${index}`,
      }));
    }
    return list.filter(section => section.data.length > 0);
  }, [swapCurrencyList, ensResults]);
  const lastSearchQuery = usePrevious(searchQueryForSearch);

  const currencyListDataKey = useMemo(
    () =>
      `${swapCurrencyList?.[0]?.data?.[0]?.address || '_'}_${
        ensResults?.[0]?.data?.[0]?.address || '_'
      }`,
    [ensResults, swapCurrencyList]
  );

  useHardwareBackOnFocus(() => {
    cancelSearch();
    // prevent other back handlers from firing
    return true;
  });

  useEffect(() => {
    const checkAndHandlePoaps = async secretWordOrHash => {
      await getPoapAndOpenSheetWithSecretWord(secretWordOrHash);
      await getPoapAndOpenSheetWithQRHash(secretWordOrHash);
    };
    checkAndHandlePoaps(searchQueryForPoap);
  }, [searchQueryForPoap]);

  const handlePress = useCallback(
    item => {
      if (item.ens) {
        // navigate to Showcase sheet
        searchInputRef?.current?.blur();
        InteractionManager.runAfterInteractions(() => {
          navigate(
            profilesEnabled ? Routes.PROFILE_SHEET : Routes.SHOWCASE_SHEET,
            {
              address: item.nickname,
              fromRoute: 'DiscoverSearch',
              setIsSearchModeEnabled,
            }
          );
          if (profilesEnabled) {
            analytics.track('Viewed ENS profile', {
              category: 'profiles',
              ens: item.nickname,
              from: 'Discover search',
            });
          }
        });
      } else {
        const asset = ethereumUtils.getAccountAsset(item.uniqueId);
        dispatch(emitAssetRequest(item.address));
        navigate(Routes.EXPANDED_ASSET_SHEET, {
          asset: asset || item,
          fromDiscover: true,
          type: 'token',
        });
      }
    },
    [
      dispatch,
      navigate,
      profilesEnabled,
      searchInputRef,
      setIsSearchModeEnabled,
    ]
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

  const addEnsResults = useCallback(
    ensResults => {
      let ensSearchResults = [];
      if (ensResults && ensResults.length) {
        ensSearchResults = [
          {
            color: colors.appleBlue,
            data: ensResults,
            key: 'profiles',
            title: `􀉮 ${lang.t('discover.search.profiles')}`,
          },
        ];
      }
      setEnsResults(ensSearchResults);
    },
    [colors.appleBlue]
  );

  useEffect(() => {
    if (searchQueryForSearch && !isSearching) {
      if (lastSearchQuery !== searchQueryForSearch) {
        setIsSearching(true);
        fetchSuggestions(
          searchQuery,
          addEnsResults,
          setIsFetchingEns,
          profilesEnabled
        );
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
    profilesEnabled,
  ]);

  useEffect(() => {
    if (!swapCurrencyListLoading && !isFetchingEns) {
      setIsSearching(false);
    }
  }, [isFetchingEns, setIsSearching, swapCurrencyListLoading]);

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
    <View
      key={currencyListDataKey}
      style={{ height: deviceUtils.dimensions.height - 140 }}
    >
      <SearchContainer>
        <CurrencySelectionList
          footerSpacer
          fromDiscover
          itemProps={itemProps}
          keyboardDismissMode="on-drag"
          listItems={currencyList}
          loading={swapCurrencyListLoading || isFetchingEns}
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
