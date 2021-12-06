import analytics from '@segment/analytics-react-native';
import { findIndex, keys, times, toLower } from 'lodash';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { FlatList, LayoutAnimation } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { emitAssetRequest, emitChartsRequest } from '../../redux/explorer';
import { DefaultTokenLists } from '../../references';
import { ButtonPressAnimation } from '../animations';
import { AssetListItemSkeleton } from '../asset-list';
import { ListCoinRow } from '../coin-row';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../expanded-state/asset/ChartExpandedState... Remove this comment to see the full error message
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import { Centered, Column, Flex, Row } from '../layout';
import { Emoji, Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './EdgeFade' was resolved to '/Users/nickby... Remove this comment to see the full error message
import EdgeFade from './EdgeFade';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  useAccountAssets,
  useAccountSettings,
  useUserLists,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';

const COINGECKO_TRENDING_ENDPOINT =
  'https://api.coingecko.com/api/v3/search/trending';

const fetchTrendingAddresses = async (coingeckoIds: any) => {
  const trendingAddresses: any = [];
  try {
    const request = await fetch(COINGECKO_TRENDING_ENDPOINT);
    const trending = await request.json();
    const idsToLookUp = trending.coins.map((coin: any) => coin.item?.id);
    keys(coingeckoIds).forEach(address => {
      if (idsToLookUp.indexOf(coingeckoIds[address]) !== -1) {
        trendingAddresses.push(toLower(address));
      }
    });
    // eslint-disable-next-line no-empty
  } catch (e) {}
  return trendingAddresses;
};

const ListButton = styled(ButtonPressAnimation).attrs({
  scaleTo: 0.96,
})`
  margin-right: 16px;
  ${({ selected, theme: { colors } }) =>
    selected
      ? `
        background-color: ${colors.alpha(colors.blueGreyDark, 0.06)};
        border-radius: 12px;
        height: 30px;
        padding-horizontal: 8px;
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        padding-top: ${ios ? 6.5 : 4.5}px;
      `
      : `
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        padding-top: ${ios ? 6.5 : 4.5}px;
      `}
`;

const ListName = styled(Text)`
  margin-left: 3px;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  margin-top: ${ios ? -4.5 : 0}px;
`;

// Update trending lists every 5 minutes
const TRENDING_LIST_UPDATE_INTERVAL = 5 * 60 * 1000;

const layouts = [
  { length: 110, offset: 0 },
  { length: 89, offset: 110 },
  { length: 120, offset: 200 },
  { length: 81, offset: 320 },
  { length: 92, offset: 400 },
];
// @ts-expect-error ts-migrate(7006) FIXME: Parameter '_' implicitly has an 'any' type.
const getItemLayout = (_, index) => ({
  index,
  ...layouts[index],
});

export default function ListSection() {
  const dispatch = useDispatch();
  const { network, nativeCurrency } = useAccountSettings();
  const { navigate } = useNavigation();
  const {
    favorites,
    lists,
    updateList,
    ready,
    selectedList,
    setSelectedList,
    clearList,
  } = useUserLists();
  const listRef = useRef(null);
  const initialized = useRef(false);
  const { allAssets } = useAccountAssets();
  const genericAssets = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
    ({ data: { genericAssets } }) => genericAssets
  );

  const coingeckoIds = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'additionalAssetsData' does not exist on ... Remove this comment to see the full error message
    ({ additionalAssetsData: { coingeckoIds } }) => coingeckoIds
  );

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const listData = useMemo(() => DefaultTokenLists[network], [network]);

  const assetsSocket = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'explorer' does not exist on type 'Defaul... Remove this comment to see the full error message
    ({ explorer: { assetsSocket } }) => assetsSocket
  );
  useEffect(() => {
    if (assetsSocket !== null) {
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '({ tokens }: { tokens: any; }) =... Remove this comment to see the full error message
      Object.values(listData).forEach(({ tokens }) => {
        dispatch(emitAssetRequest(tokens));
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
        dispatch(emitChartsRequest(tokens));
      });
    }
  }, [assetsSocket, dispatch, listData]);

  const trendingListHandler = useRef(null);

  const updateTrendingList = useCallback(async () => {
    const tokens = await fetchTrendingAddresses(coingeckoIds);
    clearList('trending');

    dispatch(emitAssetRequest(tokens));
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
    dispatch(emitChartsRequest(tokens));
    updateList(tokens, 'trending', true);

    // @ts-expect-error ts-migrate(2322) FIXME: Type 'Timeout' is not assignable to type 'null'.
    trendingListHandler.current = setTimeout(
      () => updateTrendingList(),
      TRENDING_LIST_UPDATE_INTERVAL
    );
  }, [clearList, coingeckoIds, dispatch, updateList]);

  const handleSwitchList = useCallback(
    (id, index) => {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
      );
      setSelectedList(id);
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'scrollToIndex' does not exist on type 'n... Remove this comment to see the full error message
      listRef.current?.scrollToIndex({
        animated: true,
        index,
        viewPosition: 0.5,
      });
    },
    [setSelectedList]
  );

  useEffect(() => {
    if (ready && !initialized.current) {
      ready && updateTrendingList();
      const currentListIndex = findIndex(
        lists,
        // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
        list => list?.id === selectedList
      );
      if (listData?.length > 0) {
        setTimeout(() => {
          if (lists[currentListIndex]) {
            handleSwitchList(lists[currentListIndex]?.id, currentListIndex);
          }
        }, 300);
      }
      initialized.current = true;
    }
    return () => {
      // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
      clearTimeout(trendingListHandler.current);
    };
  }, [
    ready,
    clearList,
    dispatch,
    updateList,
    updateTrendingList,
    lists,
    selectedList,
    handleSwitchList,
    listData?.length,
  ]);

  const listItems = useMemo(() => {
    if (network !== networkTypes.mainnet) {
      return [];
    }
    let items = [];
    if (selectedList === 'favorites') {
      items = favorites
        .map(
          (address: any) =>
            ethereumUtils.getAsset(allAssets, toLower(address)) ||
            ethereumUtils.formatGenericAsset(
              genericAssets[toLower(address)],
              nativeCurrency
            )
        )
        .sort((a: any, b: any) => (a.name > b.name ? 1 : -1));
    } else {
      if (!lists?.length) return [];
      const currentList = lists.find((list: any) => list?.id === selectedList);
      if (!currentList) {
        return [];
      }

      items = currentList.tokens.map(
        (address: any) =>
          ethereumUtils.getAsset(allAssets, toLower(address)) ||
          ethereumUtils.formatGenericAsset(
            genericAssets[toLower(address)],
            nativeCurrency
          )
      );
    }

    return items.filter(
      (item: any) => item.symbol && Number(item.price?.value) > 0
    );
  }, [
    allAssets,
    favorites,
    genericAssets,
    lists,
    nativeCurrency,
    network,
    selectedList,
  ]);

  const handlePress = useCallback(
    item => {
      analytics.track('Pressed List Item', {
        category: 'discover',
        selectedList,
        symbol: item.symbol,
      });
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset: item,
        fromDiscover: true,
        longFormHeight: initialChartExpandedStateSheetHeight,
        type: 'token',
      });
    },
    [navigate, selectedList]
  );

  const itemProps = useMemo(
    () => ({
      showAddButton: true,
      showBalance: false,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item: list, index }) => (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ListButton
        key={`list-${list?.id}`}
        onPress={() => handleSwitchList(list?.id, index)}
        selected={selectedList === list?.id}
        testID={`list-${list?.id}`}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Emoji name={list.emoji} size="small" />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ListName
            color={
              selectedList === list?.id
                ? colors.alpha(colors.blueGreyDark, 0.8)
                : colors.alpha(colors.blueGreyDark, 0.5)
            }
            lineHeight="paragraphSmall"
            size="lmedium"
            weight="bold"
          >
            {list.name}
          </ListName>
        </Row>
      </ListButton>
    ),
    [colors, handleSwitchList, selectedList]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column testID="lists-section">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Flex paddingHorizontal={19}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text size="larger" weight="heavy">
          Lists
        </Text>
      </Flex>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Fragment>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <FlatList
            contentContainerStyle={{
              paddingBottom: 6,
              paddingHorizontal: 19,
              paddingTop: 10,
            }}
            data={listData}
            getItemLayout={getItemLayout}
            horizontal
            keyExtractor={item => item?.id}
            ref={listRef}
            renderItem={renderItem}
            scrollsToTop={false}
            showsHorizontalScrollIndicator={false}
            testID={`lists-section-${selectedList}`}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <EdgeFade />
        </Column>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column>
          {!ready ? (
            times(2, index => (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <AssetListItemSkeleton
                animated
                descendingOpacity
                key={`skeleton-pools-${index}`}
              />
            ))
          ) : listItems?.length ? (
            listItems.map((item: any) => (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <ListCoinRow
                {...itemProps}
                item={item}
                key={`${selectedList}-list-item-${item.address}`}
                onPress={() => handlePress(item)}
              />
            ))
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Centered marginVertical={42}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text
                color={colors.alpha(colors.blueGreyDark, 0.3)}
                size="large"
                weight="semibold"
              >
                This list is empty!
              </Text>
            </Centered>
          )}
        </Column>
      </Fragment>
    </Column>
  );
}
