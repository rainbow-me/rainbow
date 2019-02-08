import PropTypes from 'prop-types';
import React from 'react';
import { FlatList } from 'react-native';
import { pure } from 'recompact';
import { safeAreaInsetValues } from '../../utils';
import { BubbleSheet } from '../bubble-sheet';
import { FlexItem } from '../layout';
import WalletConnectListItem from './WalletConnectListItem';

const maxListItemsForDeviceSize = safeAreaInsetValues.bottom ? 4 : 3;

const scrollIndicatorInset = BubbleSheet.borderRadius - 8;
const scrollIndicatorInsets = {
  bottom: scrollIndicatorInset,
  top: scrollIndicatorInset,
};

const keyExtractor = ({ expires }) => expires;

// eslint-disable-next-line react/prop-types
const renderItem = ({ item }) => <WalletConnectListItem {...item} />;

const WalletConnectList = ({ items, onLayout, ...props }) => (
  <FlexItem
    maxHeight={WalletConnectListItem.height * maxListItemsForDeviceSize}
    minHeight={WalletConnectListItem.height}
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

WalletConnectList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape(WalletConnectListItem.propTypes)),
  onLayout: PropTypes.func,
};

WalletConnectList.defaultProps = {
  items: [],
};

export default pure(WalletConnectList);
