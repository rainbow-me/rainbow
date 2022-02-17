import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import { times, toLower } from 'lodash';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { FlatList, LayoutAnimation } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { emitAssetRequest, emitChartsRequest } from '../../redux/explorer';
import { DefaultTokenLists } from '../../references';
import { ButtonPressAnimation } from '../animations';
import { AssetListItemSkeleton } from '../asset-list';
import { ListCoinRow } from '../coin-row';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import { Centered, Column, Flex, Row } from '../layout';
import { Emoji, Text } from '../text';
import EdgeFade from './EdgeFade';
import { getTrendingAddresses } from '@rainbow-me/handlers/dispersion';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { useAccountSettings, useUserLists } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { ethereumUtils } from '@rainbow-me/utils';

const ListButton = styled(ButtonPressAnimation).attrs({
  scaleTo: 0.96,
})(({ selected, theme: { colors } }) => ({
  marginRight: 16,
  paddingTop: ios ? 6.5 : 4.5,

  ...(selected && {
    backgroundColor: colors.alpha(colors.blueGreyDark, 0.06),
    borderRadius: 12,
    height: 30,
    paddingHorizontal: 8,
  }),
}));

const ListName = styled(Text)({
  marginLeft: 3,
  marginTop: ios ? -4.5 : 0,
});

// Update trending lists every 5 minutes
const TRENDING_LIST_UPDATE_INTERVAL = 5 * 60 * 1000;

const layouts = [
  { length: 110, offset: 0 },
  { length: 89, offset: 110 },
  { length: 120, offset: 200 },
  { length: 81, offset: 320 },
  { length: 92, offset: 400 },
];
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
  const genericAssets = useSelector(
    ({ data: { genericAssets } }) => genericAssets
  );

  const { colors } = useTheme();
  const listData = useMemo(() => DefaultTokenLists[network], [network]);

  const assetsSocket = useSelector(
    ({ explorer: { assetsSocket } }) => assetsSocket
  );
  useEffect(() => {
    if (assetsSocket !== null) {
      Object.values(listData).forEach(({ tokens }) => {
        dispatch(emitAssetRequest(tokens));
        dispatch(emitChartsRequest(tokens));
      });
    }
  }, [assetsSocket, dispatch, listData]);

  const trendingListHandler = useRef(null);

  const updateTrendingList = useCallback(async () => {
    const tokens = await getTrendingAddresses();
    clearList('trending');

    if (tokens) {
      dispatch(emitAssetRequest(tokens));
      dispatch(emitChartsRequest(tokens));
      updateList(tokens, 'trending', true);
    }

    trendingListHandler.current = setTimeout(
      () => updateTrendingList(),
      TRENDING_LIST_UPDATE_INTERVAL
    );
  }, [clearList, dispatch, updateList]);

  const handleSwitchList = useCallback(
    (id, index) => {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
      );
      setSelectedList(id);
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
      const currentListIndex = lists.findIndex(
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
          address =>
            ethereumUtils.getAccountAsset(address) ||
            ethereumUtils.formatGenericAsset(
              genericAssets[toLower(address)],
              nativeCurrency
            )
        )
        .sort((a, b) => (a.name > b.name ? 1 : -1));
    } else {
      if (!lists?.length) return [];
      const currentList = lists.find(list => list?.id === selectedList);
      if (!currentList) {
        return [];
      }

      items = currentList.tokens.map(
        address =>
          ethereumUtils.getAccountAsset(address) ||
          ethereumUtils.formatGenericAsset(
            genericAssets[toLower(address)],
            nativeCurrency
          )
      );
    }

    return items.filter(item => item.symbol && Number(item.price?.value) > 0);
  }, [favorites, genericAssets, lists, nativeCurrency, network, selectedList]);

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

  const renderItem = useCallback(
    ({ item: list, index }) => (
      <ListButton
        key={`list-${list?.id}`}
        onPress={() => handleSwitchList(list?.id, index)}
        selected={selectedList === list?.id}
        testID={`list-${list?.id}`}
      >
        <Row>
          <Emoji name={list.emoji} size="small" />
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
    <Column testID="lists-section">
      <Flex paddingHorizontal={19}>
        <Text size="larger" weight="heavy">
          {lang.t('discover.lists.lists_title')}
        </Text>
      </Flex>

      <Fragment>
        <Column>
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
          <EdgeFade />
        </Column>
        <Column>
          {!ready ? (
            times(2, index => (
              <AssetListItemSkeleton
                animated
                descendingOpacity
                key={`skeleton-pools-${index}`}
              />
            ))
          ) : listItems?.length ? (
            listItems.map(item => (
              <ListCoinRow
                item={item}
                key={`${selectedList}-list-item-${item.address}`}
                onPress={() => handlePress(item)}
                showBalance={false}
              />
            ))
          ) : (
            <Centered marginVertical={42}>
              <Text
                color={colors.alpha(colors.blueGreyDark, 0.3)}
                size="large"
                weight="semibold"
              >
                {lang.t('discover.lists.this_list_is_empty')}
              </Text>
            </Centered>
          )}
        </Column>
      </Fragment>
    </Column>
  );
}
