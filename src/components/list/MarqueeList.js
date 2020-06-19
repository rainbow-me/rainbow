import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import { TopMoverCoinRow } from '../coin-row';

const contentContainerStyle = { paddingVertical: 8 };
const keyExtractor = ({ address }) => `MarqueeList-${address}`;
const renderItem = ({ item }) => (
  <TopMoverCoinRow {...item} key={item?.address} />
);

const MarqueeFlatList = styled(FlatList).attrs({
  contentContainerStyle,
  directionalLockEnabled: true,
  horizontal: true,
  initialNumToRender: 8,
  keyExtractor,
  removeClippedSubviews: true,
  renderItem,
  scrollEventThrottle: 32,
  showsHorizontalScrollIndicator: false,
  windowSize: 11,
})`
  width: 100%;
`;

const MarqueeList = ({ items = [], measureItem, onLayout, ...props }) => {
  const listRef = useRef();
  const [itemWidths, setItemWidths] = useState([]);

  const updateItemWidths = useCallback(async () => {
    const widths = await Promise.all(items.map(measureItem));
    setItemWidths(widths);
  }, [items, measureItem]);

  useEffect(() => {
    updateItemWidths();
  }, [updateItemWidths]);

  console.log('itemWidths', itemWidths);

  return (
    <MarqueeFlatList
      {...props}
      data={items}
      onLayout={onLayout}
      ref={listRef}
    />
  );
};

export default MarqueeList;
