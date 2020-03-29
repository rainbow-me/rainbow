import React from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers, withState } from 'recompact';
import { requireNativeComponent, Clipboard, Linking, View } from 'react-native';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import { isAvatarPickerAvailable } from '../../config/experimental';
import {
  withAccountInfo,
  withAccountSettings,
  withAccountTransactions,
  withRequests,
  withContacts,
} from '../../hoc';
import { removeRequest } from '../../redux/requests';
import { abbreviations, ethereumUtils } from '../../utils';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import { colors } from '../../styles';
import LoadingState from '../activity-list/LoadingState';
import { FloatingEmojis } from '../floating-emojis';

const NativeTransactionListView = requireNativeComponent('TransactionListView');

class TransactionList extends React.PureComponent {
  static defaultProps = {
    style: {},
  };

  onCopyAddressPress = e => {
    const { x, y, width, height } = e.nativeEvent;
    this.props.setTapTarget([x, y, width, height]);
    if (this.onNewEmoji) {
      this.onNewEmoji();
    }
    Clipboard.setString(this.props.accountAddress);
  };

  render() {
    if (!this.props.initialized && !this.props.navigation.isFocused()) {
      return <LoadingState>{this.props.header}</LoadingState>;
    }

    const data = {
      requests: this.props.requests,
      transactions: this.props.transactions,
    };

    return (
      <View style={this.props.style}>
        <NativeTransactionListView
          data={data}
          accountAddress={this.props.accountAddress}
          accountColor={colors.avatarColor[this.props.accountColor]}
          accountName={this.props.accountName}
          onReceivePress={this.props.onReceivePress}
          onAvatarPress={this.props.onAvatarPress}
          onCopyAddressPress={this.onCopyAddressPress}
          onRequestPress={this.props.onRequestPress}
          onRequestExpire={this.props.onRequestExpire}
          onTransactionPress={this.props.onTransactionPress}
          style={this.props.style}
          isAvatarPickerAvailable={isAvatarPickerAvailable}
        />
        <FloatingEmojis
          style={{
            height: 0,
            left: this.props.tapTarget[0] - 24,
            position: 'absolute',
            top: this.props.tapTarget[1] - this.props.tapTarget[3],
            width: this.props.tapTarget[2],
          }}
        >
          {({ onNewEmoji }) => {
            if (!this.onNewEmoji) {
              this.onNewEmoji = onNewEmoji;
            }
            return null;
          }}
        </FloatingEmojis>
      </View>
    );
  }
}

export default compose(
  connect(null, { removeExpiredRequest: removeRequest }),
  withAccountInfo,
  withAccountSettings,
  withAccountTransactions,
  withRequests,
  withContacts,
  withState('tapTarget', 'setTapTarget', [0, 0, 0, 0]),
  withHandlers({
    onAvatarPress: ({ navigation, accountColor, accountName }) => () => {
      navigation.navigate('AvatarBuilder', {
        accountColor,
        accountName,
      });
    },
    onReceivePress: ({ navigation }) => () => {
      navigation.navigate('ReceiveModal');
    },
    onRequestExpire: ({ requests, removeExpiredRequest }) => e => {
      const { index } = e.nativeEvent;
      const item = requests[index];
      removeExpiredRequest(item.requestId);
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
    onTransactionPress: ({
      transactions,
      contacts,
      navigation,
      network,
    }) => e => {
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
              const etherscanHost = ethereumUtils.getEtherscanHostFromNetwork(
                network
              );
              Linking.openURL(`https://${etherscanHost}/tx/${normalizedHash}`);
            }
          }
        );
      }
    },
  })
)(TransactionList);
