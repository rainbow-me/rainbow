import Clipboard from '@react-native-community/clipboard';
import lang from 'i18n-js';
import startCase from 'lodash/startCase';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { requireNativeComponent } from 'react-native';
import { useDispatch } from 'react-redux';
import { getRandomColor } from '../../styles/colors';
import { FloatingEmojis } from '../floating-emojis';
import { analytics } from '@/analytics';
import { TransactionStatusTypes } from '@/entities';
import showWalletErrorAlert from '@/helpers/support';
import TransactionActions from '@/helpers/transactionActions';
import {
  getHumanReadableDate,
  hasAddableContact,
} from '@/helpers/transactions';
import { pickShallow } from '@/helpers/utilities';
import { isValidDomainFormat } from '@/helpers/validators';
import {
  useAccountProfile,
  useOnAvatarPress,
  useSafeImageUri,
  useWallets,
} from '@/hooks';
import { useNavigation } from '@/navigation/Navigation';
import { removeRequest } from '@/redux/requests';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import {
  abbreviations,
  ethereumUtils,
  showActionSheetWithOptions,
} from '@/utils';
import config from '@/model/config';

const NativeTransactionListView = requireNativeComponent('TransactionListView');

const Container = styled.View({
  flex: 1,
  marginTop: 0,
});

const FloatingEmojisRegion = styled(FloatingEmojis).attrs({
  distance: 250,
  duration: 500,
  fadeOut: false,
  scaleTo: 0,
  size: 50,
  wiggleFactor: 0,
})({
  height: 0,
  left: ({ tapTarget }) => tapTarget[0] - 24,
  position: 'absolute',
  top: ({ tapTarget }) => tapTarget[1] - tapTarget[3],
  width: ({ tapTarget }) => tapTarget[2],
});

export default function TransactionList({
  addCashAvailable,
  contacts,
  initialized,
  isLoading,
  requests,
  transactions,
}) {
  const { isDamaged } = useWallets();
  const [tapTarget, setTapTarget] = useState([0, 0, 0, 0]);
  const onNewEmoji = useRef();
  const setOnNewEmoji = useCallback(
    newOnNewEmoji => (onNewEmoji.current = newOnNewEmoji),
    []
  );
  const dispatch = useDispatch();
  const { navigate, isFocused } = useNavigation();
  const {
    accountAddress,
    accountColor,
    accountSymbol,
    accountName,
    accountImage,
  } = useAccountProfile();

  const onAddCashPress = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    if (!config.wyre_enabled) {
      navigate(Routes.EXPLAIN_SHEET, { type: 'wyre_degradation' });
      return;
    }

    navigate(Routes.ADD_CASH_FLOW);
    analytics.track('Tapped Add Cash', {
      category: 'add cash',
    });
  }, [navigate, isDamaged]);

  const {
    avatarOptions,
    onAvatarChooseImage,
    onAvatarRemovePhoto,
    onAvatarPickEmoji,
    onAvatarPress,
    onAvatarWebProfile,
  } = useOnAvatarPress();

  const onReceivePress = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }
    navigate(Routes.RECEIVE_MODAL);
  }, [navigate, isDamaged]);

  const onRequestExpire = useCallback(
    e => {
      const { index } = e.nativeEvent;
      const item = requests[index];
      item && item.requestId && dispatch(removeRequest(item.requestId));
    },
    [dispatch, requests]
  );

  const onRequestPress = useCallback(
    e => {
      const { index } = e.nativeEvent;
      const item = requests[index];
      navigate(Routes.CONFIRM_REQUEST, { transactionDetails: item });
      return;
    },
    [navigate, requests]
  );

  const onTransactionPress = useCallback(
    e => {
      const { index } = e.nativeEvent;
      const item = transactions[index];
      const { hash, from, minedAt, network, pending, to, status, type } = item;

      const date = getHumanReadableDate(minedAt);

      const isSent =
        status === TransactionStatusTypes.sending ||
        status === TransactionStatusTypes.sent;
      const showContactInfo = hasAddableContact(status, type);

      const headerInfo = {
        address: '',
        divider: isSent
          ? lang.t('account.tx_to_lowercase')
          : lang.t('account.tx_from_lowercase'),
        type: status.charAt(0).toUpperCase() + status.slice(1),
      };

      const contactAddress = isSent ? to : from;
      const contact = contacts[contactAddress];
      let contactColor = 0;

      if (contact) {
        headerInfo.address = contact.nickname;
        contactColor = contact.color;
      } else {
        headerInfo.address = isValidDomainFormat(contactAddress)
          ? contactAddress
          : abbreviations.address(contactAddress, 4, 10);
        contactColor = getRandomColor();
      }

      const isOutgoing = from?.toLowerCase() === accountAddress?.toLowerCase();
      const canBeResubmitted = isOutgoing && !minedAt;
      const canBeCancelled =
        canBeResubmitted && status !== TransactionStatusTypes.cancelling;

      const blockExplorerAction = lang.t('wallet.action.view_on', {
        blockExplorerName: startCase(ethereumUtils.getBlockExplorer(network)),
      });

      if (hash) {
        let buttons = [
          ...(canBeResubmitted ? [TransactionActions.speedUp] : []),
          ...(canBeCancelled ? [TransactionActions.cancel] : []),
          blockExplorerAction,
          ...(ios ? [TransactionActions.close] : []),
        ];
        if (showContactInfo) {
          buttons.unshift(
            contact
              ? TransactionActions.viewContact
              : TransactionActions.addToContacts
          );
        }

        showActionSheetWithOptions(
          {
            cancelButtonIndex: buttons.length - 1,
            options: buttons,
            title: pending
              ? `${headerInfo.type}${
                  showContactInfo
                    ? ' ' + headerInfo.divider + ' ' + headerInfo.address
                    : ''
                }`
              : showContactInfo
              ? `${headerInfo.type} ${date} ${headerInfo.divider} ${headerInfo.address}`
              : `${headerInfo.type} ${date}`,
          },
          buttonIndex => {
            const action = buttons[buttonIndex];
            switch (action) {
              case TransactionActions.viewContact:
              case TransactionActions.addToContacts:
                navigate(Routes.MODAL_SCREEN, {
                  address: contactAddress,
                  asset: item,
                  color: contactColor,
                  contact,
                  type: 'contact_profile',
                });
                break;
              case TransactionActions.speedUp:
                navigate(Routes.SPEED_UP_AND_CANCEL_SHEET, {
                  tx: item,
                  type: 'speed_up',
                });
                break;
              case TransactionActions.cancel:
                navigate(Routes.SPEED_UP_AND_CANCEL_SHEET, {
                  tx: item,
                  type: 'cancel',
                });
                break;
              case blockExplorerAction:
                ethereumUtils.openTransactionInBlockExplorer(hash, network);
                break;
              default: {
                return;
              }
            }
          }
        );
      }
    },
    [accountAddress, contacts, navigate, transactions]
  );

  const onCopyAddressPress = useCallback(
    e => {
      if (isDamaged) {
        showWalletErrorAlert();
        return;
      }
      const { x, y, width, height } = e.nativeEvent;
      setTapTarget([x, y, width, height]);
      if (onNewEmoji && onNewEmoji.current) {
        onNewEmoji.current();
      }
      Clipboard.setString(accountAddress);
    },
    [accountAddress, isDamaged]
  );

  const onAccountNamePress = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const loading = useMemo(() => (!initialized && !isFocused()) || isLoading, [
    initialized,
    isLoading,
    isFocused,
  ]);

  const safeAccountImage = useSafeImageUri(accountImage);
  const { isDarkMode, colors } = useTheme();

  const onNativeAvatarMenuSelect = useCallback(
    e => {
      const { selection } = e.nativeEvent;
      switch (selection) {
        case 'newimage':
          onAvatarChooseImage();
          break;
        case 'newemoji':
          onAvatarPickEmoji();
          break;
        case 'removeimage':
          onAvatarRemovePhoto();
          break;
        case 'webprofile':
          onAvatarWebProfile();
          break;
        default:
          break;
      }
    },
    [
      onAvatarChooseImage,
      onAvatarPickEmoji,
      onAvatarRemovePhoto,
      onAvatarWebProfile,
    ]
  );

  const data = useMemo(() => {
    const requestsNative = requests.map(request => {
      const { displayDetails: { timestampInMs } = {} } = request;
      const pickProps = pickShallow(request, [
        'clientId',
        'dappName',
        'imageUrl',
        'payloadId',
      ]);
      if (timestampInMs) {
        Object.assign(pickProps, { displayDetails: { timestampInMs } });
      }
      return pickProps;
    });
    return {
      requests: requestsNative,
      transactions,
    };
  }, [requests, transactions]);

  return (
    <Container>
      <Container
        accountAddress={accountName}
        accountColor={colors.avatarBackgrounds[accountColor]}
        accountImage={safeAccountImage}
        accountName={accountSymbol}
        addCashAvailable={addCashAvailable}
        as={NativeTransactionListView}
        avatarOptions={avatarOptions}
        darkMode={isDarkMode}
        data={data}
        isLoading={loading}
        onAccountNamePress={onAccountNamePress}
        onAddCashPress={onAddCashPress}
        onAvatarPress={onAvatarPress}
        onCopyAddressPress={onCopyAddressPress}
        onNativeAvatarMenuSelect={onNativeAvatarMenuSelect}
        onReceivePress={onReceivePress}
        onRequestExpire={onRequestExpire}
        onRequestPress={onRequestPress}
        onTransactionPress={onTransactionPress}
      />
      <FloatingEmojisRegion
        setOnNewEmoji={setOnNewEmoji}
        tapTarget={tapTarget}
      />
    </Container>
  );
}
