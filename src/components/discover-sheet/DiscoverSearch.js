import { map, toLower } from 'lodash';
import matchSorter from 'match-sorter';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import { addHexPrefix } from '../../handlers/web3';
import CurrencySelectionTypes from '../../helpers/currencySelectionTypes';
import tokenSectionTypes from '../../helpers/tokenSectionTypes';
import { emitAssetRequest } from '../../redux/explorer';
import deviceUtils from '../../utils/deviceUtils';
import { CurrencySelectionList } from '../exchange';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import { Row } from '../layout';
import DiscoverSheetContext from './DiscoverSheetContext';
import {
  useAccountAssets,
  useTimeout,
  useUniswapAssets,
  useUniswapAssetsInWallet,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { filterList } from '@rainbow-me/utils';

const headerlessSection = data => [{ data, title: '' }];

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

const timingConfig = { duration: 700 };

export default function DiscoverSearch() {
  const { navigate } = useNavigation();
  const listOpacity = useSharedValue(0);
  const { allAssets } = useAccountAssets();

  const listAnimatedStyles = useAnimatedStyle(() => {
    return {
      opacity: listOpacity.value,
    };
  });

  useEffect(() => {
    listOpacity.value = withTiming(1, timingConfig);
  }, [listOpacity]);

  const { setIsSearching, searchQuery, isSearchModeEnabled } = useContext(
    DiscoverSheetContext
  );
  const [searchQueryForSearch, setSearchQueryForSearch] = useState('');
  const type = CurrencySelectionTypes.output;
  const dispatch = useDispatch();
  const {
    curatedNotFavorited,
    favorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    globalVerifiedAssets,
    loadingAllTokens,
  } = useUniswapAssets();
  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const { colors } = useTheme();

  const currencyList = useMemo(() => {
    let filteredList = [];
    if (type === CurrencySelectionTypes.input) {
      filteredList = headerlessSection(uniswapAssetsInWallet);
      if (searchQueryForSearch) {
        filteredList = searchCurrencyList(
          uniswapAssetsInWallet,
          searchQueryForSearch
        );
        filteredList = headerlessSection(filteredList);
      }
    } else if (type === CurrencySelectionTypes.output) {
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
    }
    setIsSearching(false);
    return filteredList;
  }, [
    type,
    setIsSearching,
    uniswapAssetsInWallet,
    searchQueryForSearch,
    favorites,
    globalVerifiedAssets,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    colors.yellowFavorite,
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
      const asset = allAssets.find(asset => item.address === asset.address);

      dispatch(emitAssetRequest(item.address));

      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset: asset || item,
        longFormHeight: initialChartExpandedStateSheetHeight,
        type: 'token',
      });
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
    <Animated.View
      style={[
        listAnimatedStyles,
        !android && { height: deviceUtils.dimensions.height - 140 },
      ]}
    >
      <Row height="100%">
        <CurrencySelectionList
          itemProps={itemProps}
          keyboardDismissMode="on-drag"
          listItems={currencyList}
          loading={loadingAllTokens}
          query={searchQueryForSearch}
          ref={ref}
          showList
          testID="discover-currency-select-list"
          type={type}
        />
      </Row>
    </Animated.View>
  );
}
