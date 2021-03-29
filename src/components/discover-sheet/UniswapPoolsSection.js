import { times } from 'lodash';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, LayoutAnimation } from 'react-native';
import styled from 'styled-components';
import { SORT_DIRECTION } from '../../hooks/useUniswapPools';
import { ButtonPressAnimation } from '../animations';
import { AssetListItemSkeleton } from '../asset-list';
import UniswapLogo from '../icons/UniswapLogo';
import { UniswapPoolListRow } from '../investment-cards';
import { Centered, Column, Row } from '../layout';
import { Text } from '../text';
import EdgeFade from './EdgeFade';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { useAccountSettings, useUniswapPools } from '@rainbow-me/hooks';

const ITEM_HEIGHT = 60;
const getItemLayout = (_, index) => ({
  index,
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
});

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
    name: 'Liquidity',
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
  <UniswapPoolListRow assetType="uniswap" item={item} />
);

export default function UniswapPools() {
  const listRef = useRef(null);
  const { colors, isDarkMode } = useTheme();
  const { network } = useAccountSettings();
  const [selectedList, setSelectedList] = useState(listData[0].id);
  const [sortDirection, setSortDirection] = useState(SORT_DIRECTION.DESC);
  const { pairs, error, is30DayEnabled } = useUniswapPools(
    selectedList,
    sortDirection
  );

  const listDataFiltered = useMemo(() => {
    if (!is30DayEnabled) {
      return listData.filter(item => item.id !== 'profit30d');
    }
    return listData;
  }, [is30DayEnabled]);

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

  const renderTypeItem = useCallback(
    ({ item: list, index }) => (
      <PoolListButton
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
            {selectedList === list.id
              ? sortDirection === 'desc'
                ? '􀄩'
                : '􀄨'
              : ''}
          </ListName>
        </Row>
      </PoolListButton>
    ),
    [getTitleColor, handleSwitchList, selectedList, sortDirection]
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
    return allPairs;
  }, [allPairs, selectedList, sortDirection]);

  return (
    <Column marginTop={32}>
      <Row marginBottom={12} paddingHorizontal={19}>
        <UniswapLogo
          borderRadius={8}
          height={22}
          imageStyle={{
            height: 18,
            marginBottom: 2.5,
            marginRight: 1,
            width: 16,
          }}
          marginRight={7}
          marginTop={android ? 8 : 1}
          shadowBlur={4.5}
          shadowColor={isDarkMode ? colors.shadow : colors.purpleUniswap}
          shadowOffset={{ height: 3, width: 0 }}
          shadowOpacity={0.2}
          width={22}
        />
        <Text size="larger" testID="pools-section" weight="heavy">
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
        <FlatList
          data={pairsSorted}
          getItemLayout={getItemLayout}
          keyExtractor={item => item.address}
          removeClippedSubviews
          renderItem={renderUniswapPoolListRow}
          scrollsToTop={false}
          windowSize={11}
        />
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
