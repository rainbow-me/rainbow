import { times } from 'lodash';
import React, { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, LayoutAnimation } from 'react-native';
import styled from 'styled-components';
import { SORT_DIRECTION } from '../../hooks/useUniswapPools';
import { ButtonPressAnimation } from '../animations';
import { AssetListItemSkeleton } from '../asset-list';
import { UniswapPoolListRow } from '../investment-cards';
import { Centered, Column, Row } from '../layout';
import { Text } from '../text';
import EdgeFade from './EdgeFade';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { useAccountSettings, useUniswapPools } from '@rainbow-me/hooks';

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
        <Text align="center" color={color} size="lmedium" weight="heavy">
          Show more
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
})`
  margin-top: ${android ? 0 : -4};
`;

const PoolListButton = styled(ButtonPressAnimation).attrs({
  scaleTo: 0.96,
})`
  margin-right: 16px;
  ${({ selected, theme: { colors }, titleColor }) =>
    selected
      ? `
        background-color: ${colors.alpha(titleColor, 0.06)};
        border-radius: 12px;
        height: 30px;
        padding-horizontal: 8px;
        padding-top: ${ios ? 6 : 4}px;
      `
      : `
        padding-top: ${ios ? 6 : 4}px;
      `}
`;

const ListName = styled(Text)`
  margin-left: 3px;
  margin-top: ${ios ? -4.5 : 0}px;
`;

const listData = [
  {
    id: 'liquidity',
    name: 'Pool size',
  },
  {
    id: 'annualized_fees',
    name: 'Annualized fees',
  },
  {
    id: 'profit30d',
    name: '30d profit',
  },
  {
    id: 'oneDayVolumeUSD',
    name: '24h volume',
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
  const [selectedList, setSelectedList] = useState(listData[0].id);
  const [sortDirection, setSortDirection] = useState(SORT_DIRECTION.DESC);
  const { pairs, error, is30DayEnabled, isEmpty } = useUniswapPools(
    selectedList,
    sortDirection,
    token
  );

  const listDataFiltered = useMemo(() => {
    if (!is30DayEnabled) {
      return listData.filter(item => item.id !== 'profit30d');
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
        disabled={pairsSorted.length === 1 && selectedList === list.id}
        key={`list-${list.id}`}
        onPress={() => handleSwitchList(list.id, index)}
        selected={selectedList === list.id}
        testID={`pools-list-${list.id}`}
        titleColor={getTitleColor(selectedList === list.id, list.id)}
      >
        <Row>
          <ListName
            color={getTitleColor(selectedList === list.id, list.id)}
            lineHeight="paragraphSmall"
            size="lmedium"
            weight="bold"
          >
            {list.name}{' '}
            {selectedList === list.id && pairsSorted.length !== 1
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
    <Column marginTop={25}>
      <Row marginBottom={12} paddingHorizontal={19}>
        <PoolEmoji>🐋</PoolEmoji>
        <Text size="larger" testID="pools-section" weight="heavy">
          {' '}
          Uniswap Pools
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
            keyExtractor={item => item.id}
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
          There was an error loading Uniswap pool data...
        </ErrorMessage>
      ) : network !== networkTypes.mainnet ? (
        <ErrorMessage colors={colors}>
          Pools are disabled on Testnets
        </ErrorMessage>
      ) : pairsSorted?.length > 0 ? (
        <Fragment>
          <FlatList
            contentContainerStyle={flatListContainerStyle}
            data={pairsSorted}
            keyExtractor={(item, index) => index}
            renderItem={renderUniswapPoolListRow}
          />
          {(!showAll || alwaysShowMoreButton) &&
            initialPageAmount < allPairs.length && (
              <ShowMoreButton
                backgroundColor={colors.alpha(colors.blueGreyDark, 0.06)}
                color={colors.alpha(colors.blueGreyDark, 0.6)}
                onPress={handleShowMorePress}
                paddingTop={10}
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
