import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { usePrevious, useWallets } from '@/hooks';
import { setupAndroidChannels } from '@/notifications/setupAndroidChannels';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import {
  FixedRemoteMessage,
  MinimalNotification,
  NotificationTypes,
} from '@/notifications/types';
import { handleShowingForegroundNotification } from '@/notifications/foregroundHandler';
import {
  registerTokenRefreshListener,
  saveFCMToken,
} from '@/notifications/tokens';
import { WALLETCONNECT_SYNC_DELAY } from '@/notifications/constants';
import { useDispatch } from 'react-redux';
import { requestsForTopic } from '@/redux/requests';
import { ThunkDispatch } from 'redux-thunk';
import store, { AppState } from '@/redux/store';
import { AnyAction } from 'redux';
import { NotificationStorage } from '@/notifications/deferredNotificationStorage';
import { Navigation } from '@/navigation';
import Routes from '@rainbow-me/routes';
import {
  AppState as ApplicationState,
  AppStateStatus,
  NativeEventSubscription,
} from 'react-native';
import notifee, {
  Event as NotifeeEvent,
  EventType,
} from '@notifee/react-native';

type Callback = () => void;

type Props = PropsWithChildren<{ walletReady: boolean }>;

export const NotificationsHandler = ({ children, walletReady }: Props) => {
  const wallets = useWallets();
  const walletsRef = useRef(wallets);
  const prevWalletReady = usePrevious(walletReady);
  const dispatch: ThunkDispatch<AppState, unknown, AnyAction> = useDispatch();
  const onTokenRefreshListener = useRef<Callback>();
  const foregroundNotificationListener = useRef<Callback>();
  const notificationOpenedListener = useRef<Callback>();
  const appStateListener = useRef<NativeEventSubscription>();
  const appState = useRef<AppStateStatus>(null);
  const notifeeForegroundEventListener = useRef<Callback>();

  // We need to save useWallets result to a ref in order to provide
  // an always up-to-date reference for event listeners
  walletsRef.current = wallets;

  useEffect(() => {
    setupAndroidChannels();
    saveFCMToken();
    onTokenRefreshListener.current = registerTokenRefreshListener();
    foregroundNotificationListener.current = messaging().onMessage(
      onForegroundRemoteNotification
    );
    messaging().setBackgroundMessageHandler(onBackgroundRemoteNotification);
    messaging().getInitialNotification().then(handleAppOpenedWithNotification);
    notificationOpenedListener.current = messaging().onNotificationOpenedApp(
      handleAppOpenedWithNotification
    );
    appStateListener.current = ApplicationState.addEventListener(
      'change',
      nextAppState => {
        if (appState.current === 'background' && nextAppState === 'active') {
          handleDeferredNotificationIfNeeded();
        }
      }
    );
    notifeeForegroundEventListener.current = notifee.onForegroundEvent(
      handleNotificationPressed
    );

    return () => {
      onTokenRefreshListener.current?.();
      foregroundNotificationListener.current?.();
      notificationOpenedListener.current?.();
      appStateListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (prevWalletReady !== walletReady) {
      handleDeferredNotificationIfNeeded();
    }
  }, [walletReady]);

  const onForegroundRemoteNotification = (
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ) => {
    const type = remoteMessage?.data?.type;
    if (type === NotificationTypes.walletConnect) {
      handleWalletConnectNotification(remoteMessage);
    } else if (remoteMessage?.notification !== undefined) {
      handleShowingForegroundNotification(remoteMessage as FixedRemoteMessage);
    }
  };

  const onBackgroundRemoteNotification = async (
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ) => {
    const type = remoteMessage?.data?.type;
    if (type === NotificationTypes.walletConnect) {
      handleWalletConnectNotification(remoteMessage);
    }
  };

  const handleWalletConnectNotification = (
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ) => {
    const topic = remoteMessage?.data?.topic;

    setTimeout(() => {
      const requests = dispatch(requestsForTopic(topic));
      if (requests) {
        // WC requests will open automatically
        return false;
      }
    }, WALLETCONNECT_SYNC_DELAY);
  };

  const handleDeferredNotificationIfNeeded = () => {
    const notification = NotificationStorage.getDeferredNotification();
    if (notification) {
      performActionBasedOnOpenedNotificationType(notification);
      NotificationStorage.clearDeferredNotification();
    }
  };

  const handleAppOpenedWithNotification = (
    remoteMessage: FirebaseMessagingTypes.RemoteMessage | null
  ) => {
    if (!remoteMessage) {
      return;
    }
    const notification: MinimalNotification = {
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      data: remoteMessage.data,
    };
    handleOpenedNotification(notification);
  };

  const handleNotificationPressed = (event: NotifeeEvent) => {
    if (event.type === EventType.PRESS) {
      handleOpenedNotification(event.detail.notification);
    }
  };

  const handleOpenedNotification = (notification?: MinimalNotification) => {
    if (!notification) {
      return;
    }
    // Need to call getState() directly, because the event handler
    // has the old value reference in its closure
    if (!store.getState().appState.walletReady) {
      NotificationStorage.deferNotification(notification);
      return;
    }
    performActionBasedOnOpenedNotificationType(notification);
  };

  const performActionBasedOnOpenedNotificationType = (
    notification: MinimalNotification
  ) => {
    const data = notification?.data;
    const type = data?.type;

    if (type === NotificationTypes.transaction) {
      if (!data?.address) {
        return;
      }

      // Using the function stored in the ref intentionally
      walletsRef.current
        .switchToWalletWithAddress(data.address)
        .then(walletAddress => {
          if (walletAddress === null) {
            return;
          }
          Navigation.handleAction(Routes.PROFILE_SCREEN, {});
          // TODO: Open action sheet for tx
        });
    }
  };

  return children;
};
