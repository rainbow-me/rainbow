import Clipboard from '@react-native-community/clipboard';
import analytics from '@segment/analytics-react-native';
import { toLower } from 'lodash';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { requireNativeComponent } from 'react-native';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { getRandomColor } from '../../styles/colors';
import { FloatingEmojis } from '../floating-emojis';
import useExperimentalFlag, {
  AVATAR_PICKER,
} from '@rainbow-me/config/experimentalHooks';
import { TransactionStatusTypes } from '@rainbow-me/entities';
import showWalletErrorAlert from '@rainbow-me/helpers/support';
import TransactionActions from '@rainbow-me/helpers/transactionActions';
import {
  getHumanReadableDate,
  hasAddableContact,
} from '@rainbow-me/helpers/transactions';
import {
  isENSAddressFormat,
  isUnstoppableAddressFormat,
} from '@rainbow-me/helpers/validators';
import {
  useAccountProfile,
  useOnAvatarPress,
  useSafeImageUri,
  useWallets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import { removeRequest } from '@rainbow-me/redux/requests';
import Routes from '@rainbow-me/routes';
import {
  abbreviations,
  ethereumUtils,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';

const NativeTransactionListView = requireNativeComponent('TransactionListView');

const Container = styled.View`
  flex: 1;
  margin-top: 0;
`;

const FloatingEmojisRegion = styled(FloatingEmojis).attrs({
  distance: 250,
  duration: 500,
  fadeOut: false,
  scaleTo: 0,
  size: 50,
  wiggleFactor: 0,
})`
  height: 0;
  left: ${({ tapTarget }) => tapTarget[0] - 24};
  position: absolute;
  top: ${({ tapTarget }) => tapTarget[1] - tapTarget[3]};
  width: ${({ tapTarget }) => tapTarget[2]};
`;

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

    navigate(Routes.ADD_CASH_FLOW);
    analytics.track('Tapped Add Cash', {
      category: 'add cash',
    });
  }, [navigate, isDamaged]);

  const onAvatarPress = useOnAvatarPress();

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
        headerInfo.address =
          isENSAddressFormat(contactAddress) ||
          isUnstoppableAddressFormat(contactAddress)
            ? contactAddress
            : abbreviations.address(contactAddress, 4, 10);
        contactColor = getRandomColor();
      }

      const isOutgoing = toLower(from) === toLower(accountAddress);
      const canBeResubmitted = isOutgoing && !minedAt;
      const canBeCancelled =
        canBeResubmitted && status !== TransactionStatusTypes.cancelling;

      if (hash) {
        let buttons = [
          ...(canBeResubmitted ? [TransactionActions.speedUp] : []),
          ...(canBeCancelled ? [TransactionActions.cancel] : []),
          ethereumUtils.supportsEtherscan(network)
            ? TransactionActions.viewOnEtherscan
            : TransactionActions.viewOnBlockExplorer,
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
              case TransactionActions.viewOnBlockExplorer:
              case TransactionActions.viewOnEtherscan: {
                ethereumUtils.openTransactionInBlockExplorer(hash, network);
                break;
              }
              default:
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

  const data = useMemo(
    () => ({
      requests,
      transactions,
    }),
    [requests, transactions]
  );

  const loading = useMemo(() => (!initialized && !isFocused()) || isLoading, [
    initialized,
    isLoading,
    isFocused,
  ]);

  const isAvatarPickerAvailable = useExperimentalFlag(AVATAR_PICKER);

  const safeAccountImage = useSafeImageUri(accountImage);
  const { isDarkMode, colors } = useTheme();

  return (
    <Container>
      <Container
        accountAddress={accountName}
        accountColor={colors.avatarBackgrounds[accountColor]}
        accountImage={safeAccountImage}
        accountName={accountSymbol}
        addCashAvailable={addCashAvailable}
        as={NativeTransactionListView}
        darkMode={isDarkMode}
        data={data}
        isAvatarPickerAvailable={isAvatarPickerAvailable}
        isLoading={loading}
        onAccountNamePress={onAccountNamePress}
        onAddCashPress={onAddCashPress}
        onAvatarPress={onAvatarPress}
        onCopyAddressPress={onCopyAddressPress}
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
