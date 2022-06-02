import lang from 'i18n-js';
import { times } from 'lodash';
import React, { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, LayoutAnimation } from 'react-native';
import { SORT_DIRECTION } from '../../hooks/useUniswapPools';
import { ButtonPressAnimation } from '../animations';
import { AssetListItemSkeleton } from '../asset-list';
import { UniswapPoolListRow } from '../investment-cards';
import { Centered, Column, Row } from '../layout';
import { Text } from '../text';
import EdgeFade from './EdgeFade';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { useAccountSettings, useUniswapPools } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';

const INITIAL_PAGE_AMOUNT = 15;

const flatListContainerStyle = { paddingBottom: 10 };

const DefaultShowMoreButton = ({ backgroundColor, color, onPress }) => (
  <Row justify="center">
    <ButtonPressAnimation onPress={onPress}>
      <Row
        backgroundColor={backgroundColor}
        borderRadius={18}
        height={36}
        paddingHorizontal={12}
        paddingTop={android ? 3 : 7}
      >
        <Text
          align="center"
          color={color}
          lineHeight={android ? 30 : 20}
          size="lmedium"
          weight="heavy"
        >
          {lang.t('discover.uniswap.show_more')}
        </Text>
      </Row>
    </ButtonPressAnimation>
  </Row>
);

const ErrorMessage = ({ colors, children }) => (
  <Centered marginVertical={50}>
    <Text
      color={colors.alpha(colors.blueGreyDark, 0.3)}
      size="large"
      weight="semibold"
    >
      {children}
    </Text>
  </Centered>
);

const PoolEmoji = styled(Text).attrs({
  size: 'large',
  weight: 'heavy',
})({
  marginTop: android ? 0 : -4,
});

const PoolListButton = styled(ButtonPressAnimation).attrs({
  scaleTo: 0.96,
})(({ selected, theme: { colors }, titleColor }) => ({
  ...(selected && {
    backgroundColor: colors.alpha(titleColor, 0.06),
    borderRadius: 12,
    height: 30,
    paddingHorizontal: 8,
  }),

  marginRight: 16,
  paddingTop: ios ? 6.5 : 4.5,
}));

const ListName = styled(Text)({
  marginLeft: 3,
  marginTop: ios ? -4.5 : 0,
});

const listData = [
  {
    id: 'liquidity',
    name: lang.t('discover.uniswap.data.pool_size'),
  },
  {
    id: 'annualized_fees',
    name: lang.t('discover.uniswap.data.annualized_fees'),
  },
  {
    id: 'profit30d',
    name: lang.t('discover.uniswap.data.profit_30_days'),
  },
  {
    id: 'oneDayVolumeUSD',
    name: lang.t('discover.uniswap.data.volume_24_hours'),
  },
];

const renderUniswapPoolListRow = ({ item }) => (
  <UniswapPoolListRow assetType="uniswap" item={item} key={item.address} />
);

export default function UniswapPools({
  token,
  hideIfEmpty,
  initialPageAmount = INITIAL_PAGE_AMOUNT,
  ShowMoreButton = DefaultShowMoreButton,
  forceShowAll,
  alwaysShowMoreButton,
}) {
  const listRef = useRef(null);
  const { colors } = useTheme();
  const { network } = useAccountSettings();
  const [showAllState, setShowAll] = useState(false);
  const showAll = forceShowAll === undefined ? showAllState : forceShowAll;
  const [selectedList, setSelectedList] = useState(listData[0]?.id);
  const [sortDirection, setSortDirection] = useState(SORT_DIRECTION.DESC);
  const { pairs, error, is30DayEnabled, isEmpty } = useUniswapPools(
    selectedList,
    sortDirection,
    token
  );

  const listDataFiltered = useMemo(() => {
    if (!is30DayEnabled) {
      return listData.filter(item => item?.id !== 'profit30d');
    }
    return listData;
  }, [is30DayEnabled]);

  const handleShowMorePress = useCallback(() => {
    setShowAll(true);
  }, []);

  const handleSwitchList = useCallback(
    (id, index) => {
      // This crashes the app on android
      // that's why it's disabled...
      ios &&
        LayoutAnimation.configureNext(
          LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
        );
      if (id === selectedList) {
        setSortDirection(
          sortDirection === SORT_DIRECTION.DESC
            ? SORT_DIRECTION.ASC
            : SORT_DIRECTION.DESC
        );
      } else {
        setSelectedList(id);
        sortDirection === SORT_DIRECTION.ASC &&
          setSortDirection(SORT_DIRECTION.DESC);
        listRef.current?.scrollToIndex({
          animated: true,
          index,
          viewPosition: 0.5,
        });
      }
    },
    [selectedList, sortDirection]
  );

  const getTitleColor = useCallback(
    (selected, listId) => {
      if (!selected) {
        return colors.alpha(colors.blueGreyDark, 0.5);
      }

      switch (listId) {
        case 'annualized_fees':
          return colors.green;
        case 'profit30d':
          return sortDirection === SORT_DIRECTION.ASC
            ? colors.red
            : colors.green;
        case 'oneDayVolumeUSD':
          return colors.swapPurple;
        default:
          return colors.appleBlue;
      }
    },
    [colors, sortDirection]
  );

  const allPairs = useMemo(() => {
    if (!pairs) return [];

    const sortedPairs = pairs
      .filter(pair => {
        if (pair[selectedList] === 0) return false;
        if (pair[selectedList] <= 0.005 && pair[selectedList] > 0) return false;
        return selectedList !== 'profit30d' || pair.profit30d !== undefined;
      })
      .map(item => ({
        ...item,
        attribute: selectedList,
      }));

    return sortedPairs;
  }, [pairs, selectedList]);

  const pairsSorted = useMemo(() => {
    if (sortDirection === SORT_DIRECTION.ASC) {
      allPairs.sort((a, b) => a[selectedList] - b[selectedList]);
    }
    if (!showAll) {
      return allPairs.slice(0, initialPageAmount);
    }

    return allPairs;
  }, [allPairs, initialPageAmount, selectedList, showAll, sortDirection]);

  const renderTypeItem = useCallback(
    ({ item: list, index }) => (
      <PoolListButton
        disabled={pairsSorted.length === 1 && selectedList === list?.id}
        key={`list-${list?.id}`}
        onPress={() => handleSwitchList(list?.id, index)}
        selected={selectedList === list?.id}
        testID={`pools-list-${list?.id}`}
        titleColor={getTitleColor(selectedList === list?.id, list?.id)}
      >
        <Row>
          <ListName
            color={getTitleColor(selectedList === list?.id, list?.id)}
            lineHeight="paragraphSmall"
            size="lmedium"
            weight="bold"
          >
            {list.name}{' '}
            {selectedList === list?.id && pairsSorted.length !== 1
              ? sortDirection === 'desc'
                ? '􀄩'
                : '􀄨'
              : ''}
          </ListName>
        </Row>
      </PoolListButton>
    ),
    [
      getTitleColor,
      handleSwitchList,
      pairsSorted.length,
      selectedList,
      sortDirection,
    ]
  );

  if (hideIfEmpty && (!pairs?.length || isEmpty)) {
    return null;
  }

  return (
    <Column marginTop={32}>
      <Row marginBottom={12} paddingHorizontal={19}>
        <PoolEmoji>🐋</PoolEmoji>
        <Text size="larger" testID="pools-section" weight="heavy">
          {' '}
          {lang.t('discover.uniswap.title_pools')}
        </Text>
      </Row>
      <Column>
        <Column>
          <FlatList
            contentContainerStyle={{
              paddingBottom: 10,
              paddingHorizontal: 19,
            }}
            data={listDataFiltered}
            horizontal
            keyExtractor={item => item?.id}
            ref={listRef}
            renderItem={renderTypeItem}
            scrollsToTop={false}
            showsHorizontalScrollIndicator={false}
            testID={`pools-section-${selectedList}`}
          />
          <EdgeFade />
        </Column>
      </Column>
      {error ? (
        <ErrorMessage colors={colors}>
          {lang.t('discover.uniswap.error_loading_uniswap')}...
        </ErrorMessage>
      ) : network !== networkTypes.mainnet ? (
        <ErrorMessage colors={colors}>
          {lang.t('discover.uniswap.disabled_testnets')}
        </ErrorMessage>
      ) : pairsSorted?.length > 0 ? (
        <Fragment>
          <FlatList
            contentContainerStyle={flatListContainerStyle}
            data={pairsSorted}
            keyExtractor={(item, index) => index}
            renderItem={renderUniswapPoolListRow}
            scrollsToTop={false}
          />
          {(!showAll || alwaysShowMoreButton) &&
            initialPageAmount < allPairs.length && (
              <ShowMoreButton
                backgroundColor={colors.alpha(colors.blueGreyDark, 0.06)}
                color={colors.alpha(colors.blueGreyDark, 0.6)}
                onPress={handleShowMorePress}
              />
            )}
        </Fragment>
      ) : (
        times(3, index => (
          <AssetListItemSkeleton
            animated
            descendingOpacity
            key={`skeleton-pools-${index}`}
          />
        ))
      )}
    </Column>
  );
}
