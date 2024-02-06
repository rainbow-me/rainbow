import React from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlexItem } from '../layout';
import WalletConnectListItem, { WalletConnectListItemHeight } from './WalletConnectListItem';
import { useWalletConnectConnections } from '@/hooks';

const scrollIndicatorInset = 22;
const scrollIndicatorInsets = {
  bottom: scrollIndicatorInset,
  top: scrollIndicatorInset,
};

const keyExtractor = item => item.dappUrl;

const renderItem = ({ item }) => <WalletConnectListItem {...item} />;

export default function WalletConnectList({ onLayout, ...props }) {
  const insets = useSafeAreaInsets();
  const maxListItemsForDeviceSize = insets.bottom ? 4 : 3;
  const { walletConnectorsByDappName } = useWalletConnectConnections();

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
        data={walletConnectorsByDappName}
        height={500}
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
