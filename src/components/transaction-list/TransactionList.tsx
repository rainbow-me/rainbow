import Clipboard from '@react-native-community/clipboard';
import analytics from '@segment/analytics-react-native';
import { pick, startCase, toLower } from 'lodash';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { requireNativeComponent } from 'react-native';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { getRandomColor } from '../../styles/colors';
import { FloatingEmojis } from '../floating-emojis';
import useExperimentalFlag, {
  AVATAR_PICKER,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/config/experimenta... Remove this comment to see the full error message
} from '@rainbow-me/config/experimentalHooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { TransactionStatusTypes } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/support' o... Remove this comment to see the full error message
import showWalletErrorAlert from '@rainbow-me/helpers/support';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/transactio... Remove this comment to see the full error message
import TransactionActions from '@rainbow-me/helpers/transactionActions';
import {
  getHumanReadableDate,
  hasAddableContact,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/transactio... Remove this comment to see the full error message
} from '@rainbow-me/helpers/transactions';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/validators... Remove this comment to see the full error message
import { isValidDomainFormat } from '@rainbow-me/helpers/validators';
import {
  useAccountProfile,
  useOnAvatarPress,
  useSafeImageUri,
  useWallets,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation/Navigat... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation/Navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/requests' or... Remove this comment to see the full error message
import { removeRequest } from '@rainbow-me/redux/requests';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
import {
  abbreviations,
  ethereumUtils,
  showActionSheetWithOptions,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/utils';

const NativeTransactionListView = requireNativeComponent('TransactionListView');

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
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
}: any) {
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
        headerInfo.address = isValidDomainFormat(contactAddress)
          ? contactAddress
          : abbreviations.address(contactAddress, 4, 10);
        contactColor = getRandomColor();
      }

      const isOutgoing = toLower(from) === toLower(accountAddress);
      const canBeResubmitted = isOutgoing && !minedAt;
      const canBeCancelled =
        canBeResubmitted && status !== TransactionStatusTypes.cancelling;

      const blockExplorerAction = `View on ${startCase(
        ethereumUtils.getBlockExplorer(network)
      )}`;

      if (hash) {
        let buttons = [
          ...(canBeResubmitted ? [TransactionActions.speedUp] : []),
          ...(canBeCancelled ? [TransactionActions.cancel] : []),
          blockExplorerAction,
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
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
          (buttonIndex: any) => {
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
              case TransactionActions.close:
                return;
              default: {
                ethereumUtils.openTransactionInBlockExplorer(hash, network);
                break;
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
        // @ts-expect-error ts-migrate(2722) FIXME: Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
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

  const isAvatarPickerAvailable = useExperimentalFlag(AVATAR_PICKER);

  const safeAccountImage = useSafeImageUri(accountImage);
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
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
    const requestsNative = requests.map((request: any) =>
      pick(request, [
        'clientId',
        'dappName',
        'imageUrl',
        'payloadId',
        'displayDetails.timestampInMs',
      ])
    );
    return {
      requests: requestsNative,
      transactions,
    };
  }, [requests, transactions]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
        isAvatarPickerAvailable={isAvatarPickerAvailable}
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
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <FloatingEmojisRegion
        setOnNewEmoji={setOnNewEmoji}
        tapTarget={tapTarget}
      />
    </Container>
  );
}
