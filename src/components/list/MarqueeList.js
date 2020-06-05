import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import { TopMoverCoinRow } from '../coin-row';

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

const MarqueeList = ({ items = [], measureItem, onLayout }) => {
  const listRef = useRef();
  const [itemWidths, setItemWidths] = useState([]);

  const updateItemWidths = useCallback(async () => {
    const widths = await Promise.all(items.map(measureItem));
    setItemWidths(widths);
  }, [items, measureItem]);

  useEffect(() => {
    console.log('happening');
    updateItemWidths();
  }, [updateItemWidths]);

  const renderItemCallback = useCallback(
    ({ item }) => <TopMoverCoinRow {...item} key={item?.address} />,
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
