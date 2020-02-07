import React from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers, withState } from 'recompact';
import { requireNativeComponent, Clipboard, Linking, View } from 'react-native';
import { FloatingEmojis } from '../floating-emojis';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import {
  withAccountSettings,
  withAccountTransactions,
  withRequests,
  withContacts,
} from '../../hoc';
import { removeRequest } from '../../redux/requests';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import { colors } from '../../styles';
import { abbreviations } from '../../utils';

const NativeTransactionListView = requireNativeComponent('TransactionListView');

class TransactionList extends React.PureComponent {
  static defaultProps = {
    style: {},
  };

  render() {
    const data = {
      transactions: this.props.transactions,
      requests: this.props.requests,
    };
    return (
      <View style={this.props.style}>
        <NativeTransactionListView
          data={data}
          accountAddress={this.props.accountAddress}
          onReceivePress={this.props.onReceivePress}
          onCopyAddressPress={this.props.onCopyAddressPress}
          onRequestPress={this.props.onRequestPress}
          onRequestExpire={this.props.onRequestExpire}
          onTransactionPress={this.props.onTransactionPress}
          style={this.props.style}
        />
        <FloatingEmojis
          style={{
            height: 0,
            left: this.props.tapTarget[0] - 24,
            top: this.props.tapTarget[1] - this.props.tapTarget[3],
            width: this.props.tapTarget[2],
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
  connect(null, { removeExpiredRequest: removeRequest }),
  withAccountSettings,
  withAccountTransactions,
  withRequests,
  withContacts,
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
    onRequestPress: ({ requests, navigation }) => e => {
      const { index } = e.nativeEvent;
      const item = requests[index];
      navigation.navigate({
        params: { transactionDetails: item },
        routeName: 'ConfirmRequest',
      });
      return;
    },
    onRequestExpire: ({ requests, removeExpiredRequest }) => e => {
      const { index } = e.nativeEvent;
      const item = requests[index];
      removeExpiredRequest(item.requestId);
    },
    onTransactionPress: ({ transactions, contacts, navigation }) => e => {
      const { index } = e.nativeEvent;
      const item = transactions[index];
      const { hash, from, to, status } = item;

      const isSent = status === TransactionStatusTypes.sent;
      const headerInfo = {
        address: '',
        divider: isSent ? 'to' : 'from',
        type: status.charAt(0).toUpperCase() + status.slice(1),
      };

      const contactAddress = isSent ? to : from;
      const contact = contacts[contactAddress];
      let contactColor = 0;

      if (contact) {
        headerInfo.address = contact.nickname;
        contactColor = contact.color;
      } else {
        headerInfo.address = abbreviations.address(contactAddress, 4, 10);
        contactColor = Math.floor(Math.random() * colors.avatarColor.length);
      }

      if (hash) {
        showActionSheetWithOptions(
          {
            cancelButtonIndex: 2,
            options: [
              contact ? 'View Contact' : 'Add to Contacts',
              'View on Etherscan',
              'Cancel',
            ],
            title: `${headerInfo.type} ${headerInfo.divider} ${headerInfo.address}`,
          },
          buttonIndex => {
            if (buttonIndex === 0) {
              navigation.navigate('ExpandedAssetScreen', {
                address: contactAddress,
                asset: item,
                color: contactColor,
                contact,
                type: 'contact',
              });
            } else if (buttonIndex === 1) {
              const normalizedHash = hash.replace(/-.*/g, '');
              Linking.openURL(`https://etherscan.io/tx/${normalizedHash}`);
            }
          },
        );
      }
    },
    onReceivePress: ({ navigation }) => () =>
      navigation.navigate('ReceiveModal'),
  }),
)(TransactionList);
