import Clipboard from '@react-native-community/clipboard';
import analytics from '@segment/analytics-react-native';
import { find } from 'lodash';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, requireNativeComponent } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/primitives';
import useExperimentalFlag, {
  AVATAR_PICKER,
} from '../../config/experimentalHooks';
import showWalletErrorAlert from '../../helpers/support';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import {
  getHumanReadableDate,
  hasAddableContact,
} from '../../helpers/transactions';
import { isENSAddressFormat } from '../../helpers/validators';
import { useAccountProfile, useWallets } from '../../hooks';
import { useNavigation } from '../../navigation/Navigation';
import { removeRequest } from '../../redux/requests';
import { walletsSetSelected, walletsUpdate } from '../../redux/wallets';
import { FloatingEmojis } from '../floating-emojis';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';
import {
  abbreviations,
  ethereumUtils,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';

const NativeTransactionListView = requireNativeComponent('TransactionListView');

const isAvatarEmojiPickerEnabled = true;
const isAvatarImagePickerEnabled = true;

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
  network,
  requests,
  transactions,
}) {
  const { wallets, selectedWallet, isDamaged } = useWallets();
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

  const onRemovePhoto = useCallback(async () => {
    // all this code is weak but lets ship it
    const newWallets = { ...wallets };
    const newWallet = newWallets[selectedWallet.id];
    const account = find(newWallet.addresses, ['address', accountAddress]);

    // remove zee photo
    account.image = null;
    newWallet.addresses[account.index] = account;

    dispatch(walletsSetSelected(newWallet));
    await dispatch(walletsUpdate(newWallets));
  }, [dispatch, selectedWallet, accountAddress, wallets]);

  const onAvatarPress = useCallback(() => {
    if (isAvatarImagePickerEnabled) {
      const processPhoto = image => {
        const stringIndex = image?.path.indexOf('/tmp');
        const newWallets = { ...wallets };
        const walletId = selectedWallet.id;

        newWallets[walletId].addresses.some((account, index) => {
          newWallets[walletId].addresses[index].image = `~${image?.path.slice(
            stringIndex
          )}`;

          dispatch(walletsSetSelected(newWallets[walletId]));
          return true;
        });
        dispatch(walletsUpdate(newWallets));
      };

      const avatarActionSheetOptions = [
        'Choose from Library',
        ...(isAvatarEmojiPickerEnabled ? ['Pick an Emoji'] : []),
        ...(accountImage ? ['Remove Photo'] : []),
        'Cancel', // <-- cancelButtonIndex
      ];

      showActionSheetWithOptions(
        {
          cancelButtonIndex: avatarActionSheetOptions.length - 1,
          destructiveButtonIndex: accountImage
            ? avatarActionSheetOptions.length - 2
            : undefined,
          options: avatarActionSheetOptions,
        },
        async buttonIndex => {
          if (buttonIndex === 0) {
            ImagePicker.openPicker({
              cropperCircleOverlay: true,
              cropping: true,
            }).then(processPhoto);
          } else if (buttonIndex === 1 && isAvatarEmojiPickerEnabled) {
            navigate(Routes.AVATAR_BUILDER, {
              initialAccountColor: accountColor,
              initialAccountName: accountName,
            });
          } else if (buttonIndex === 2 && accountImage) {
            onRemovePhoto();
          }
        }
      );
    } else if (isAvatarEmojiPickerEnabled) {
      navigate(Routes.AVATAR_BUILDER, {
        initialAccountColor: accountColor,
        initialAccountName: accountName,
      });
    }
  }, [
    accountColor,
    accountImage,
    accountName,
    dispatch,
    navigate,
    onRemovePhoto,
    selectedWallet.id,
    wallets,
  ]);

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
      const { hash, from, minedAt, pending, to, status, type } = item;

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
        headerInfo.address = isENSAddressFormat(contactAddress)
          ? contactAddress
          : abbreviations.address(contactAddress, 4, 10);
        contactColor = colors.getRandomColor();
      }

      if (hash) {
        let buttons = ['View on Etherscan', ...(ios ? ['Cancel'] : [])];
        if (showContactInfo) {
          buttons.unshift(contact ? 'View Contact' : 'Add to Contacts');
        }

        showActionSheetWithOptions(
          {
            cancelButtonIndex: showContactInfo ? 2 : 1,
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
            if (showContactInfo && buttonIndex === 0) {
              navigate(Routes.MODAL_SCREEN, {
                address: contactAddress,
                asset: item,
                color: contactColor,
                contact,
                type: 'contact_profile',
              });
            } else if (
              (!showContactInfo && buttonIndex === 0) ||
              (showContactInfo && buttonIndex === 1)
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
    [contacts, navigate, network, transactions]
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

  return (
    <Container>
      <Container
        accountAddress={accountName}
        accountColor={colors.avatarColor[accountColor]}
        accountImage={accountImage}
        accountName={accountSymbol}
        addCashAvailable={addCashAvailable}
        as={NativeTransactionListView}
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
