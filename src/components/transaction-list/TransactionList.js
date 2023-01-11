import Clipboard from '@react-native-community/clipboard';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { requireNativeComponent } from 'react-native';
import { useDispatch } from 'react-redux';
import { FloatingEmojis } from '../floating-emojis';
import { analyticsV2 } from '@/analytics';
import showWalletErrorAlert from '@/helpers/support';

import { pickShallow } from '@/helpers/utilities';
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
import { showTransactionDetailsSheet } from '@/handlers/transactions';
import config from '@/model/config';
import { useRoute } from '@react-navigation/core';

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
  const { name: routeName } = useRoute();

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
    analyticsV2.track(analyticsV2.event.buyButtonPressed, {
      componentName: 'TransactionList',
      routeName,
    });
  }, [isDamaged, navigate, routeName]);

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
      showTransactionDetailsSheet(item, contacts, accountAddress);
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
