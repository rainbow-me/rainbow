import React, { useCallback, useRef } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import { exchangeModalBorderRadius } from '../../screens/ExchangeModal';
import { CoinRowHeight, TopMoverCoinRow } from '../coin-row';

const contentContainerStyle = { paddingVertical: 8 };
const keyExtractor = ({ address }) => `MarqueeList-${address}`;

const MarqueeFlatList = styled(FlatList).attrs({
  // decelerationRate: 'fast',
  contentContainerStyle,
  directionalLockEnabled: true,
  horizontal: true,
  initialNumToRender: 8,
  keyExtractor,
  removeClippedSubviews: true,
  scrollEventThrottle: 32,
  showsHorizontalScrollIndicator: false,
  windowSize: 11,
})`
  width: 100%;
`;

// height: 70;
  // background-color: purple;


const MarqueeList = ({ items, onLayout }) => {
  const listRef = useRef();

  const renderItemCallback = useCallback(
    ({ item: { address, price, ...asset } }) => (
      <TopMoverCoinRow
        {...asset}
        address={address}
        key={address}
        price={price?.value}
      />
    ),
    []
  );
      // initialScrollIndex={items.length}

  return (
    <MarqueeFlatList
      data={items}
      onLayout={onLayout}
      ref={listRef}
      renderItem={renderItemCallback}
    />
  );
};

export default MarqueeList;
