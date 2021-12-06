import React from 'react';
import { FlatList } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { FlexItem } from '../layout';
import WalletConnectListItem, {
  WalletConnectListItemHeight,
  // @ts-expect-error ts-migrate(6142) FIXME: Module './WalletConnectListItem' was resolved to '... Remove this comment to see the full error message
} from './WalletConnectListItem';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useWalletConnectConnections } from '@rainbow-me/hooks';

const scrollIndicatorInset = 22;
const scrollIndicatorInsets = {
  bottom: scrollIndicatorInset,
  top: scrollIndicatorInset,
};

const keyExtractor = (item: any) => item.dappUrl;

// @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
const renderItem = ({ item }: any) => <WalletConnectListItem {...item} />;

export default function WalletConnectList({ onLayout, ...props }: any) {
  const insets = useSafeArea();
  const maxListItemsForDeviceSize = insets.bottom ? 4 : 3;
  const { walletConnectorsByDappName } = useWalletConnectConnections();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FlexItem
      borderRadius={30}
      maxHeight={WalletConnectListItemHeight * maxListItemsForDeviceSize}
      minHeight={WalletConnectListItemHeight}
      overflow="hidden"
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
