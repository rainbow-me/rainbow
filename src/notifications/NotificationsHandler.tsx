import walletTypes from '@/helpers/walletTypes';
import { usePrevious } from '@/hooks';
import { logger } from '@/logger';
import { Navigation } from '@/navigation';
import {
  NotificationSubscriptionChangesListener,
  registerNotificationSubscriptionChangesListener,
  resolveAndTrackPushNotificationPermissionStatus,
  trackTappedPushNotification,
  trackWalletsSubscribedForNotifications,
} from '@/notifications/analytics';
import { NotificationStorage } from '@/notifications/deferredNotificationStorage';
import { handleShowingForegroundNotification } from '@/notifications/foregroundHandler';
import { AddressWithRelationship, WalletNotificationRelationship } from '@/notifications/settings';
import { initializeNotificationSettingsForAllAddresses } from '@/notifications/settings/initialization';
import { setupAndroidChannels } from '@/notifications/setupAndroidChannels';
import { registerTokenRefreshListener, saveFCMToken } from '@/notifications/tokens';
import {
  FixedRemoteMessage,
  MarketingNotificationData,
  MinimalNotification,
  NotificationTypes,
  TransactionNotificationData,
} from '@/notifications/types';
import store, { AppState } from '@/redux/store';
import { transactionFetchQuery } from '@/resources/transactions/transaction';
import { switchWallet } from '@/state/wallets/switchWallet';
import { getAccountAddress, getWalletReady, useWallets, useWalletsStore } from '@/state/wallets/walletsStore';
import { isLowerCaseMatch } from '@/utils';
import notifee, { EventType, Event as NotifeeEvent } from '@notifee/react-native';
import Routes from '@rainbow-me/routes';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { useCallback, useEffect, useRef } from 'react';
import { AppState as ApplicationState, AppStateStatus, NativeEventSubscription } from 'react-native';
import { useDispatch } from 'react-redux';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

type Callback = () => void;

export const NotificationsHandler = () => {
  const wallets = useWallets();
  const dispatch: ThunkDispatch<AppState, unknown, AnyAction> = useDispatch();
  const subscriptionChangesListener = useRef<NotificationSubscriptionChangesListener>();
  const onTokenRefreshListener = useRef<Callback>();
  const foregroundNotificationListener = useRef<Callback>();
  const notificationOpenedListener = useRef<Callback>();
  const appStateListener = useRef<NativeEventSubscription>();
  const appState = useRef<AppStateStatus>(null);
  const notifeeForegroundEventListener = useRef<Callback>();
  const alreadyRanInitialization = useRef(false);

  const walletReady = useWalletsStore(state => state.walletReady);
  const prevWalletReady = usePrevious(walletReady);

  const onForegroundRemoteNotification = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    const type = remoteMessage?.data?.type;
    if (type !== NotificationTypes.walletConnect && remoteMessage?.notification !== undefined) {
      handleShowingForegroundNotification(remoteMessage as FixedRemoteMessage);
    }
  };

  const handleDeferredNotificationIfNeeded = useCallback(async () => {
    const notification = NotificationStorage.getDeferredNotification();
    if (notification) {
      // wait to wallet to load completely before opening
      performActionBasedOnOpenedNotificationType(notification);
      NotificationStorage.clearDeferredNotification();
    }
  }, []);

  const handleNotificationPressed = (event: NotifeeEvent) => {
    if (event.type === EventType.PRESS) {
      const notification = event.detail.notification;
      if (notification) {
        const minimalNotification: MinimalNotification = {
          title: notification.title,
          body: notification.body,
          data: notification.data as { [key: string]: string | object },
        };
        handleOpenedNotification(minimalNotification);
      }
    }
  };

  const handleOpenedNotification = (notification?: MinimalNotification) => {
    if (!notification) {
      return;
    }
    trackTappedPushNotification(notification);
    // Need to call getState() directly, because the event handler
    // has the old value reference in its closure
    if (!getWalletReady()) {
      NotificationStorage.deferNotification(notification);
      return;
    }
    performActionBasedOnOpenedNotificationType(notification);
  };

  const performActionBasedOnOpenedNotificationType = async (notification: MinimalNotification) => {
    const type = notification?.data?.type;

    if (type === NotificationTypes.transaction) {
      const untypedData = notification?.data;
      if (!untypedData?.address || !untypedData?.hash || !untypedData?.chain || !untypedData?.transaction_type) {
        return;
      }

      // casting data payload to type that was agreed on with backend
      const data = notification.data as unknown as TransactionNotificationData;

      const { nativeCurrency } = store.getState().settings;
      const accountAddress = getAccountAddress();

      let walletAddress: string | null | undefined = accountAddress;
      if (!isLowerCaseMatch(accountAddress, data.address)) {
        walletAddress = await switchWallet(data.address);
      }
      if (!walletAddress) {
        return;
      }
      Navigation.handleAction(Routes.PROFILE_SCREEN);

      const chainId = parseInt(data.chain, 10);

      const transaction = await transactionFetchQuery({
        hash: data.hash,
        chainId,
        address: walletAddress,
        currency: nativeCurrency,
      });

      if (!transaction) {
        return;
      }

      Navigation.handleAction(Routes.TRANSACTION_DETAILS, {
        transaction,
      });
    } else if (type === NotificationTypes.walletConnect) {
      logger.debug(`[NotificationsHandler]: handling wallet connect notification`, { notification });
    } else if (type === NotificationTypes.marketing) {
      logger.debug(`[NotificationsHandler]: handling marketing notification`, {
        notification,
      });
      const data = notification.data as unknown as MarketingNotificationData;
      if (data?.route) {
        const parsedProps = JSON.parse(data?.routeProps || '{}');
        Navigation.handleAction((Routes as any)[data.route], {
          ...(parsedProps || {}),
        });
      }
    } else {
      logger.warn(`[NotificationsHandler]: received unknown notification`, {
        notification,
      });
    }
  };

  useEffect(() => {
    const handleAppOpenedWithNotification = (remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
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

    setupAndroidChannels();
    saveFCMToken();
    trackWalletsSubscribedForNotifications();
    subscriptionChangesListener.current = registerNotificationSubscriptionChangesListener();
    onTokenRefreshListener.current = registerTokenRefreshListener();
    foregroundNotificationListener.current = messaging().onMessage(onForegroundRemoteNotification);
    messaging().getInitialNotification().then(handleAppOpenedWithNotification);
    notificationOpenedListener.current = messaging().onNotificationOpenedApp(handleAppOpenedWithNotification);
    appStateListener.current = ApplicationState.addEventListener('change', nextAppState => {
      if (appState.current === 'background' && nextAppState === 'active') {
        handleDeferredNotificationIfNeeded();
      }
    });
    notifeeForegroundEventListener.current = notifee.onForegroundEvent(handleNotificationPressed);

    resolveAndTrackPushNotificationPermissionStatus();

    return () => {
      subscriptionChangesListener.current?.remove();
      onTokenRefreshListener.current?.();
      foregroundNotificationListener.current?.();
      notificationOpenedListener.current?.();
      appStateListener.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (walletReady && prevWalletReady !== walletReady) {
      handleDeferredNotificationIfNeeded();
    }
  }, [handleDeferredNotificationIfNeeded, prevWalletReady, walletReady]);

  /*
   * Initializing MMKV storage with empty settings for all wallets that weren't yet initialized
   * and start subscribing for notifications with Firebase
   */
  useEffect(() => {
    // It is run only once per app session, that means on every app cold start
    if (walletReady && !alreadyRanInitialization.current) {
      const addresses: AddressWithRelationship[] = [];

      Object.values(wallets || {}).forEach(wallet =>
        (wallet?.addresses || []).forEach(
          ({ address, visible }: { address: string; visible: boolean }) =>
            visible &&
            addresses.push({
              address,
              relationship:
                wallet.type === walletTypes.readOnly ? WalletNotificationRelationship.WATCHER : WalletNotificationRelationship.OWNER,
            })
        )
      );
      initializeNotificationSettingsForAllAddresses(addresses);

      alreadyRanInitialization.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, walletReady]);

  return null;
};
