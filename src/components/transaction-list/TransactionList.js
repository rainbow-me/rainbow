import React from 'react';
import { compose, withHandlers, withState } from 'recompact';
import { requireNativeComponent, Clipboard, View } from 'react-native';
import { FloatingEmojis } from '../floating-emojis';
import {
  withAccountSettings,
  withAccountTransactions,
  withRequests,
} from '../../hoc';
import { showActionSheetWithOptions } from '../../utils/actionsheet';

const NativeTransactionListView = requireNativeComponent('TransactionListView');

class TransactionList extends React.PureComponent {
  static defaultProps = {
    style: {},
  };

  render() {
    return (
      <View style={this.props.style}>
        <NativeTransactionListView
          transactions={this.props.transactions}
          accountAddress={this.props.accountAddress}
          onReceivePress={this.props.onReceivePress}
          onCopyAddressPress={this.props.onCopyAddressPress}
          onItemPress={this.props.onItemPress}
          style={this.props.style}
        />
        <FloatingEmojis
          style={{
            left: this.props.tapTarget[0] - 24,
            top: this.props.tapTarget[1] - this.props.tapTarget[3],
            width: this.props.tapTarget[2],
            height: 0,
          }}
          count={this.props.emojiCount}
          distance={130}
          emoji="+1"
          size="h2"
        />
      </View>
    );
  }
}

export default compose(
  withAccountSettings,
  withAccountTransactions,
  withRequests,
  withState('emojiCount', 'setEmojiCount', 0),
  withState('tapTarget', 'setTapTarget', [0, 0, 0, 0]),
  withHandlers({
    onCopyAddressPress: ({
      accountAddress,
      emojiCount,
      setEmojiCount,
      setTapTarget,
    }) => e => {
      const { x, y, width, height } = e.nativeEvent;
      setTapTarget([x, y, width, height]);
      setEmojiCount(emojiCount + 1);
      Clipboard.setString(accountAddress);
    },
    onReceivePress: ({ navigation }) => () =>
      navigation.navigate('ReceiveModal'),
    onItemPress: ({ hash }) => () => {
      showActionSheetWithOptions(
        {
          cancelButtonIndex: 1,
          options: ['View on Etherscan', 'Cancel'],
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            const normalizedHash = hash.replace(/-.*/g, '');
            Linking.openURL(`https://etherscan.io/tx/${normalizedHash}`);
          }
        },
      );
    },
  }),
)(TransactionList);
