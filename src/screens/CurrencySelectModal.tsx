import { useIsFocused, useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { map, toLower } from 'lodash';
import { matchSorter } from 'match-sorter';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StatusBar } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/GestureBlocker' was resolved... Remove this comment to see the full error message
import GestureBlocker from '../components/GestureBlocker';
import {
  CurrencySelectionList,
  CurrencySelectModalHeader,
  ExchangeSearch,
} from '../components/exchange';
import { Column, KeyboardFixedOpenLayout } from '../components/layout';
import { Modal } from '../components/modal';
import { usePagerPosition } from '../navigation/ScrollPositionContext';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { addHexPrefix } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers' or its co... Remove this comment to see the full error message
import { CurrencySelectionTypes, TokenSectionTypes } from '@rainbow-me/helpers';
import {
  useInteraction,
  useMagicAutofocus,
  usePrevious,
  useTimeout,
  useUniswapAssets,
  useUniswapAssetsInWallet,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks/useMagicAuto... Remove this comment to see the full error message
import { delayNext } from '@rainbow-me/hooks/useMagicAutofocus';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation/Navigat... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation/Navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { filterList } from '@rainbow-me/utils';

const TabTransitionAnimation = styled(Animated.View)`
  ${position.size('100%')};
`;

const headerlessSection = (data: any) => [{ data, title: '' }];
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const Wrapper = ios ? KeyboardFixedOpenLayout : Fragment;

const searchCurrencyList = (searchList: any, query: any) => {
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

export default function CurrencySelectModal() {
  const isFocused = useIsFocused();
  const prevIsFocused = usePrevious(isFocused);
  const { navigate, dangerouslyGetState } = useNavigation();
  const {
    params: {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'onSelectCurrency' does not exist on type... Remove this comment to see the full error message
      onSelectCurrency,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'restoreFocusOnSwapModal' does not exist ... Remove this comment to see the full error message
      restoreFocusOnSwapModal,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'setPointerEvents' does not exist on type... Remove this comment to see the full error message
      setPointerEvents,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'toggleGestureEnabled' does not exist on ... Remove this comment to see the full error message
      toggleGestureEnabled,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type 'Readonly<o... Remove this comment to see the full error message
      type,
    },
  } = useRoute();

  const scrollPosition = usePagerPosition();

  const searchInputRef = useRef();
  const { handleFocus } = useMagicAutofocus(searchInputRef, undefined, true);

  const [assetsToFavoriteQueue, setAssetsToFavoriteQueue] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQueryForSearch, setSearchQueryForSearch] = useState('');
  const searchQueryExists = useMemo(() => searchQuery.length > 0, [
    searchQuery,
  ]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const {
    curatedNotFavorited,
    favorites,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    globalVerifiedAssets,
    loadingAllTokens,
    updateFavorites,
  } = useUniswapAssets();
  const uniswapAssetsInWallet = useUniswapAssetsInWallet();

  const currencyList = useMemo(() => {
    let filteredList: any = [];
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
            title: TokenSectionTypes.favoriteTokenSection,
          });

        filteredVerified.length &&
          filteredList.push({
            data: filteredVerified,
            title: TokenSectionTypes.verifiedTokenSection,
            useGradientText: IS_TESTING === 'true' ? false : true,
          });

        filteredHighUnverified.length &&
          filteredList.push({
            data: filteredHighUnverified,
            title: TokenSectionTypes.unverifiedTokenSection,
          });

        filteredLow.length &&
          filteredList.push({
            data: filteredLow,
            title: TokenSectionTypes.lowLiquidityTokenSection,
          });
      } else {
        filteredList = [
          {
            color: colors.yellowFavorite,
            data: favorites,
            title: TokenSectionTypes.favoriteTokenSection,
          },
          {
            data: curatedNotFavorited,
            title: TokenSectionTypes.verifiedTokenSection,
            useGradientText: IS_TESTING === 'true' ? false : true,
          },
        ];
      }
    }
    setIsSearching(false);
    return filteredList;
  }, [
    colors,
    curatedNotFavorited,
    favorites,
    globalVerifiedAssets,
    globalHighLiquidityAssets,
    globalLowLiquidityAssets,
    searchQueryForSearch,
    type,
    uniswapAssetsInWallet,
  ]);

  const [startQueryDebounce, stopQueryDebounce] = useTimeout();
  useEffect(() => {
    stopQueryDebounce();
    startQueryDebounce(
      () => {
        setIsSearching(true);
        setSearchQueryForSearch(searchQuery);
      },
      searchQuery === '' ? 1 : 250
    );
  }, [searchQuery, startQueryDebounce, stopQueryDebounce]);

  const handleFavoriteAsset = useCallback(
    (asset, isFavorited) => {
      setAssetsToFavoriteQueue(prevFavoriteQueue => ({
        ...prevFavoriteQueue,
        [asset.address]: isFavorited,
      }));
      analytics.track('Toggled an asset as Favorited', {
        isFavorited,
        name: asset.name,
        symbol: asset.symbol,
        tokenAddress: asset.address,
        type,
      });
    },
    [type]
  );

  const handleSelectAsset = useCallback(
    item => {
      setPointerEvents(false);
      onSelectCurrency(item);
      if (searchQueryForSearch) {
        analytics.track('Selected a search result in Swap', {
          name: item.name,
          searchQueryForSearch,
          symbol: item.symbol,
          tokenAddress: item.address,
          type,
        });
      }
      delayNext();
      dangerouslyGetState().index = 1;
      navigate(Routes.MAIN_EXCHANGE_SCREEN);
    },
    [
      setPointerEvents,
      onSelectCurrency,
      searchQueryForSearch,
      dangerouslyGetState,
      navigate,
      type,
    ]
  );

  const itemProps = useMemo(
    () => ({
      onActionAsset: handleFavoriteAsset,
      onPress: handleSelectAsset,
      showBalance: type === CurrencySelectionTypes.input,
      showFavoriteButton: type === CurrencySelectionTypes.output,
    }),
    [handleFavoriteAsset, handleSelectAsset, type]
  );

  const handleApplyFavoritesQueue = useCallback(
    () =>
      Object.keys(assetsToFavoriteQueue).map(assetToFavorite =>
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        updateFavorites(assetToFavorite, assetsToFavoriteQueue[assetToFavorite])
      ),
    [assetsToFavoriteQueue, updateFavorites]
  );

  const [startInteraction] = useInteraction();
  useEffect(() => {
    // on new focus state
    if (isFocused !== prevIsFocused) {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      android && toggleGestureEnabled(!isFocused);
      startInteraction(() => {
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        ios && toggleGestureEnabled(!isFocused);
      });
    }

    // on page blur
    if (!isFocused && prevIsFocused) {
      handleApplyFavoritesQueue();
      setSearchQuery('');
      restoreFocusOnSwapModal?.();
    }
  }, [
    handleApplyFavoritesQueue,
    isFocused,
    startInteraction,
    prevIsFocused,
    restoreFocusOnSwapModal,
    toggleGestureEnabled,
  ]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  const isFocusedAndroid = useIsFocused() && android;

  const shouldUpdateFavoritesRef = useRef(false);
  useEffect(() => {
    if (!searchQueryExists && shouldUpdateFavoritesRef.current) {
      shouldUpdateFavoritesRef.current = false;
      handleApplyFavoritesQueue();
    } else if (searchQueryExists) {
      shouldUpdateFavoritesRef.current = true;
    }
  }, [assetsToFavoriteQueue, handleApplyFavoritesQueue, searchQueryExists]);

  const style = useAnimatedStyle(() => ({
    // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
    opacity: scrollPosition.value,
    transform: [
      // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
      { scale: 0.9 + scrollPosition.value / 10 },
      // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
      { translateX: (1 - scrollPosition.value) * 8 },
    ],
  }));

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Wrapper>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TabTransitionAnimation style={style}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Modal
          containerPadding={0}
          fullScreenOnAndroid
          height="100%"
          overflow="hidden"
          radius={30}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {isFocusedAndroid && <StatusBar barStyle="dark-content" />}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <GestureBlocker type="top" />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column flex={1}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <CurrencySelectModalHeader testID="currency-select-header" />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ExchangeSearch
              isFetching={loadingAllTokens}
              isSearching={isSearching}
              onChangeText={setSearchQuery}
              onFocus={handleFocus}
              ref={searchInputRef}
              searchQuery={searchQuery}
              testID="currency-select-search"
            />
            {type === null || type === undefined ? null : (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CurrencySelectionList
                itemProps={itemProps}
                listItems={currencyList}
                loading={loadingAllTokens}
                query={searchQueryForSearch}
                showList={isFocused}
                testID="currency-select-list"
                type={type}
              />
            )}
          </Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <GestureBlocker type="bottom" />
        </Modal>
      </TabTransitionAnimation>
    </Wrapper>
  );
}
