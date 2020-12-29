import { concat, map, toLower } from 'lodash';
import matchSorter from 'match-sorter';
import React, {
  useCallback,
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
import styled from 'styled-components/primitives';
import { addHexPrefix } from '../../handlers/web3';
import CurrencySelectionTypes from '../../helpers/currencySelectionTypes';
import { emitAssetRequest } from '../../redux/explorer';
import { ButtonPressAnimation } from '../animations';
import { CurrencySelectionList, ExchangeSearch } from '../exchange';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/ChartExpandedState';
import { Column, Row } from '../layout';
import { Text } from '../text';
import {
  useAccountAssets,
  useMagicAutofocus,
  useTimeout,
  useUniswapAssets,
  useUniswapAssetsInWallet,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';
import { filterList, filterScams } from '@rainbow-me/utils';
import logger from 'logger';

const CancelButton = styled(ButtonPressAnimation)`
  margin-top: 27;
  margin-right: 19;
`;

const headerlessSection = data => [{ data, title: '' }];

const searchCurrencyList = (searchList, query) => {
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

export default function DiscoverSearch({ onCancel }) {
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

  const dismiss = useCallback(() => {
    listOpacity.value = withTiming(0, { duration: 100 }, completed => {
      logger.log('animation completed!', completed);
    });
    // TODO - FIX ME
    // This should be a callback on withTiming
    // but it never triggers!
    setTimeout(() => {
      onCancel();
    }, 100);
  }, [listOpacity, onCancel]);

  const searchInputRef = useRef();
  const { handleFocus } = useMagicAutofocus(searchInputRef, undefined, true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQueryForSearch, setSearchQueryForSearch] = useState('');
  const type = CurrencySelectionTypes.output;
  const dispatch = useDispatch();
  const {
    curatedAssets,
    favorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    loadingAllTokens,
  } = useUniswapAssets();
  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();

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
      const curatedSection = concat(favorites, curatedAssets);
      if (searchQueryForSearch) {
        const [filteredBest, filteredHigh, filteredLow] = map(
          [curatedSection, globalHighLiquidityAssets, globalLowLiquidityAssets],
          section => searchCurrencyList(section, searchQueryForSearch)
        );

        filteredList = [];
        filteredBest.length &&
          filteredList.push({
            data: filteredBest,
            title: '􀇻 Rainbow Verified',
            useGradientText: IS_TESTING === 'true' ? false : true,
          });

        const filteredHighWithoutScams = filterScams(
          filteredBest,
          filteredHigh
        );

        filteredHighWithoutScams.length &&
          filteredList.push({
            data: filteredHighWithoutScams,
            title: '􀇿 Unverified',
          });

        const filteredLowWithoutScams = filterScams(filteredBest, filteredLow);

        filteredLowWithoutScams.length &&
          filteredList.push({
            data: filteredLowWithoutScams,
            title: '􀇿 Low Liquidity',
          });
      } else {
        filteredList = [
          {
            data: concat(favorites, curatedAssets),
            title: '􀇻 Rainbow Verified',
            useGradientText: IS_TESTING === 'true' ? false : true,
          },
        ];
      }
    }
    setIsSearching(false);
    return filteredList;
  }, [
    curatedAssets,
    favorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    searchQueryForSearch,
    type,
    uniswapAssetsInWallet,
  ]);

  const [startQueryDebounce, stopQueryDebounce] = useTimeout();
  useEffect(() => {
    // stopQueryDebounce();
    // startQueryDebounce(
    //   () => {

    // TODO - FIX ME
    // Debounce is temporarilly disabled
    // because it's triggering an infinite loop
    // need to figure out wtf is going on
    setIsSearching(true);
    setSearchQueryForSearch(searchQuery);
    //},
    //  searchQuery === '' ? 1 : 250
    // );
  }, [searchQuery, startQueryDebounce, stopQueryDebounce]);

  const handlePress = useCallback(
    item => {
      const asset = allAssets.find(asset => item.address === asset.address);

      dispatch(emitAssetRequest(item.address));

      navigate(
        ios ? Routes.EXPANDED_ASSET_SHEET : Routes.EXPANDED_ASSET_SCREEN,
        {
          asset: asset || item,
          longFormHeight: initialChartExpandedStateSheetHeight,
          type: 'token',
        }
      );
    },
    [allAssets, dispatch, navigate]
  );

  const handleActionAsset = useCallback(
    item => {
      logger.log('selected item', item);
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

  return (
    <Animated.View style={listAnimatedStyles}>
      <Row>
        <Column flex={1} marginTop={19}>
          <ExchangeSearch
            isFetching={loadingAllTokens}
            isSearching={isSearching}
            onChangeText={setSearchQuery}
            onFocus={handleFocus}
            placeholderText="Search all of Ethereum"
            ref={searchInputRef}
            searchQuery={searchQuery}
            testID="discover-search"
          />
        </Column>
        <CancelButton onPress={dismiss}>
          <Text
            align="right"
            color={colors.appleBlue}
            letterSpacing="roundedMedium"
            size="large"
            weight="semibold"
          >
            Cancel
          </Text>
        </CancelButton>
      </Row>
      <Row>
        <CurrencySelectionList
          itemProps={itemProps}
          listItems={currencyList}
          loading={loadingAllTokens}
          query={searchQueryForSearch}
          showList
          testID="currency-select-list"
          type={type}
        />
      </Row>
    </Animated.View>
  );
}
