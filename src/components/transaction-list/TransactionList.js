import Clipboard from '@react-native-community/clipboard';
import analytics from '@segment/analytics-react-native';
import React from 'react';
import { Linking, requireNativeComponent, View } from 'react-native';
import { connect } from 'react-redux';
import { compose, withHandlers, withState } from 'recompact';
import { isAvatarPickerAvailable } from '../../config/experimental';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import {
  withAccountInfo,
  withAccountSettings,
  withAccountTransactions,
  withContacts,
  withRequests,
} from '../../hoc';
import { removeRequest } from '../../redux/requests';
import { colors } from '../../styles';
import { abbreviations, ethereumUtils } from '../../utils';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import LoadingState from '../activity-list/LoadingState';
import { FloatingEmojis } from '../floating-emojis';

const NativeTransactionListView = requireNativeComponent('TransactionListView');

class TransactionList extends React.PureComponent {
  static defaultProps = {
    style: {},
  };

  onCopyAddressPress = e => {
    const { accountAddress, setTapTarget } = this.props;
    const { x, y, width, height } = e.nativeEvent;
    setTapTarget([x, y, width, height]);
    if (this.onNewEmoji) {
      this.onNewEmoji();
    }
    Clipboard.setString(accountAddress);
  };

  onCopyTooltipPress = () => {
    const { accountENS, accountAddress } = this.props;
    Clipboard.setString(accountENS || accountAddress);
  };

  formatAddress = address => {
    if (address) {
      return abbreviations.address(
        address,
        4,
        abbreviations.defaultNumCharsPerSection
      );
    }
    return '';
  };

  render() {
    const {
      header,
      initialized,
      navigation,
      requests,
      transactions,
      accountAddress,
      accountColor,
      accountENS,
      accountName,
      addCashAvailable,
      onAddCashPress,
      onAvatarPress,
      onReceivePress,
      onRequestPress,
      onRequestExpire,
      onTransactionPress,
      style,
      tapTarget,
    } = this.props;

    if (!initialized && !navigation.isFocused()) {
      return <LoadingState>{header}</LoadingState>;
    }

    const addressOrEns = accountENS || this.formatAddress(accountAddress);

    const data = {
      requests,
      transactions,
    };

    return (
      <View style={style}>
        <NativeTransactionListView
          accountAddress={addressOrEns}
          accountColor={colors.avatarColor[accountColor]}
          accountName={accountName}
          addCashAvailable={addCashAvailable}
          data={data}
          isAvatarPickerAvailable={isAvatarPickerAvailable}
          onAddCashPress={onAddCashPress}
          onAvatarPress={onAvatarPress}
          onCopyAddressPress={this.onCopyAddressPress}
          onCopyTooltipPress={this.onCopyTooltipPress}
          onReceivePress={onReceivePress}
          onRequestExpire={onRequestExpire}
          onRequestPress={onRequestPress}
          onTransactionPress={onTransactionPress}
          style={style}
        />
        <FloatingEmojis
          distance={250}
          duration={500}
          fadeOut={false}
          scaleTo={0}
          size={50}
          style={{
            height: 0,
            left: tapTarget[0] - 24,
            position: 'absolute',
            top: tapTarget[1] - tapTarget[3],
            width: tapTarget[2],
          }}
          wiggleFactor={0}
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
    onAddCashPress: ({ navigation }) => () => {
      navigation.navigate('AddCashSheet');
      analytics.track('Tapped Add Cash', {
        category: 'add cash',
      });
    },
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
