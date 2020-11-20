import React from 'react';
import { FlatList } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { BubbleSheetBorderRadius } from '../bubble-sheet';
import { FlexItem } from '../layout';
import WalletConnectListItem, {
  WalletConnectListItemHeight,
} from './WalletConnectListItem';

const scrollIndicatorInset = BubbleSheetBorderRadius - 8;
const scrollIndicatorInsets = {
  bottom: scrollIndicatorInset,
  top: scrollIndicatorInset,
};

const keyExtractor = item => item.dappUrl;

const renderItem = ({ item }) => <WalletConnectListItem {...item} />;

export default function WalletConnectList({ items = [], onLayout, ...props }) {
  const insets = useSafeArea();
  const maxListItemsForDeviceSize = insets.bottom ? 4 : 3;

  return (
    <FlexItem
      borderRadius={30}
      maxHeight={WalletConnectListItemHeight * maxListItemsForDeviceSize}
      minHeight={WalletConnectListItemHeight}
      overflow="hidden"
    >
      <FlatList
        {...props}
        alwaysBounceVertical={false}
        data={items}
        keyExtractor={keyExtractor}
        onLayout={onLayout}
        removeClippedSubviews
        renderItem={renderItem}
        scrollEventThrottle={32}
        scrollIndicatorInsets={scrollIndicatorInsets}
      />
    </FlexItem>
  );
}
