import React, { useCallback, useRef } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import { exchangeModalBorderRadius } from '../../screens/ExchangeModal';
import { CoinRowHeight, TopMoverCoinRow } from '../coin-row';

const MarqueeFlatList = styled(FlatList).attrs({
  decelerationRate: 'fast',
  directionalLockEnabled: true,
  horizontal: true,
  initialNumToRender: 8,
  removeClippedSubviews: true,
  scrollEventThrottle: 32,
  showsHorizontalScrollIndicator: false,
  windowSize: 11,
})`
  height: 70;
  background-color: purple;
  width: 100%;
`;

const contentContainerStyle = {
  paddingBottom: exchangeModalBorderRadius,
};

const scrollIndicatorInsets = {
  bottom: exchangeModalBorderRadius,
};

const getItemLayout = ({ showBalance }, index) => {
  const height = showBalance ? CoinRowHeight + 1 : CoinRowHeight;

  return {
    index,
    length: height,
    offset: height * index,
  };
};

const keyExtractor = ({ uniqueId }) => `MarqueeList-${uniqueId}`;

const MarqueeList = ({ items, onLayout }) => {
  const sectionListRef = useRef();

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

  return (
    <MarqueeFlatList
      contentContainerStyle={contentContainerStyle}
      data={items}
      getItemLayout={getItemLayout}
      keyExtractor={keyExtractor}
      onLayout={onLayout}
      ref={sectionListRef}
      renderItem={renderItemCallback}
      scrollIndicatorInsets={scrollIndicatorInsets}
    />
  );
};

export default MarqueeList;
