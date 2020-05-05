import Clipboard from '@react-native-community/clipboard';
import analytics from '@segment/analytics-react-native';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, requireNativeComponent, View } from 'react-native';
import { useDispatch } from 'react-redux';
import {
  isAvatarPickerAvailable,
  isMultiwalletAvailable,
} from '../../config/experimental';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import { removeRequest } from '../../redux/requests';
import Routes from '../../screens/Routes/routesNames';
import { colors } from '../../styles';
import { abbreviations, ethereumUtils } from '../../utils';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import LoadingState from '../activity-list/LoadingState';
import { FloatingEmojis } from '../floating-emojis';

const NativeTransactionListView = requireNativeComponent('TransactionListView');

const formatAddress = address => {
  if (address) {
    return abbreviations.address(
      address,
      4,
      abbreviations.defaultNumCharsPerSection
    );
  }
  return '';
};

const TransactionList = ({
  accountAddress,
  accountColor,
  accountENS,
  accountName,
  addCashAvailable,
  contacts,
  header,
  initialized,
  isLoading,
  navigation,
  network,
  requests,
  style,
  transactions,
}) => {
  const [tapTarget, setTapTarget] = useState([0, 0, 0, 0]);
  const onNewEmoji = useRef();
  const setOnNewEmoji = useCallback(
    newOnNewEmoji => (onNewEmoji.current = newOnNewEmoji),
    []
  );
  const dispatch = useDispatch();

  const onAddCashPress = useCallback(() => {
    navigation.navigate(Routes.ADD_CASH_SHEET);
    analytics.track('Tapped Add Cash', {
      category: 'add cash',
    });
  }, [navigation]);

  const onAvatarPress = useCallback(() => {
    navigation.navigate(Routes.AVATAR_BUILDER, {
      accountColor,
      accountName,
    });
  }, [accountColor, accountName, navigation]);

  const onReceivePress = useCallback(() => {
    navigation.navigate(Routes.RECEIVE_MODAL);
  }, [navigation]);

  const onRequestExpire = useCallback(
    e => {
      const { index } = e.nativeEvent;
      const item = requests[index];
      dispatch(removeRequest(item.requestId));
    },
    [dispatch, requests]
  );

  const onRequestPress = useCallback(
    e => {
      const { index } = e.nativeEvent;
      const item = requests[index];
      navigation.navigate({
        params: { transactionDetails: item },
        routeName: Routes.CONFIRM_REQUEST,
      });
      return;
    },
    [navigation, requests]
  );

  const onTransactionPress = useCallback(
    e => {
      const { index } = e.nativeEvent;
      const item = transactions[index];
      const { hash, from, to, status } = item;

      const isPurchasing = status === TransactionStatusTypes.purchasing;
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
        let buttons = ['View on Etherscan', 'Cancel'];
        if (!isPurchasing) {
          buttons.unshift(contact ? 'View Contact' : 'Add to Contacts');
        }

        showActionSheetWithOptions(
          {
            cancelButtonIndex: isPurchasing ? 1 : 2,
            options: buttons,
            title: isPurchasing
              ? headerInfo.type
              : `${headerInfo.type} ${headerInfo.divider} ${headerInfo.address}`,
          },
          buttonIndex => {
            if (!isPurchasing && buttonIndex === 0) {
              navigation.navigate(Routes.MODAL_SCREEN, {
                address: contactAddress,
                asset: item,
                color: contactColor,
                contact,
                type: 'contact',
              });
            } else if (
              (isPurchasing && buttonIndex === 0) ||
              (!isPurchasing && buttonIndex === 1)
            ) {
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
    [contacts, navigation, network, transactions]
  );

  const onCopyAddressPress = useCallback(
    e => {
      const { x, y, width, height } = e.nativeEvent;
      setTapTarget([x, y, width, height]);
      if (onNewEmoji && onNewEmoji.current) {
        onNewEmoji.current();
      }
      Clipboard.setString(accountAddress);
    },
    [accountAddress]
  );

  const onCopyTooltipPress = useCallback(() => {
    Clipboard.setString(accountENS || accountAddress);
  }, [accountAddress, accountENS]);

  const data = useMemo(
    () => ({
      requests,
      transactions,
    }),
    [requests, transactions]
  );

  if ((!initialized && !navigation.isFocused()) || isLoading) {
    return (
      <View style={isMultiwalletAvailable ? { marginTop: 20 } : null}>
        <LoadingState>{header}</LoadingState>
      </View>
    );
  }

  const addressOrEns = accountENS || formatAddress(accountAddress);

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
        onCopyAddressPress={onCopyAddressPress}
        onCopyTooltipPress={onCopyTooltipPress}
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
        setOnNewEmoji={setOnNewEmoji}
        wiggleFactor={0}
      />
    </View>
  );
};

TransactionList.propTypes = {
  accountAddress: PropTypes.string,
  accountColor: PropTypes.number,
  accountENS: PropTypes.string,
  accountName: PropTypes.string,
  addCashAvailable: PropTypes.bool,
  contacts: PropTypes.array,
  header: PropTypes.node,
  initialized: PropTypes.bool,
  isLoading: PropTypes.bool,
  navigation: PropTypes.object,
  network: PropTypes.string,
  requests: PropTypes.array,
  style: PropTypes.object,
  transactions: PropTypes.array,
};

TransactionList.defaultProps = {
  style: {},
};

export default TransactionList;
