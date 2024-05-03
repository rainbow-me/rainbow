import { PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import { usePrevious, useWallets } from '@/hooks';
import { setupAndroidChannels } from '@/notifications/setupAndroidChannels';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import {
  FixedRemoteMessage,
  MarketingNotificationData,
  MinimalNotification,
  NotificationTypes,
  TransactionNotificationData,
} from '@/notifications/types';
import { handleShowingForegroundNotification } from '@/notifications/foregroundHandler';
import { registerTokenRefreshListener, saveFCMToken } from '@/notifications/tokens';
import { WALLETCONNECT_SYNC_DELAY } from '@/notifications/constants';
import { useDispatch } from 'react-redux';
import { requestsForTopic } from '@/redux/requests';
import { ThunkDispatch } from 'redux-thunk';
import store, { AppState } from '@/redux/store';
import { AnyAction } from 'redux';
import { NotificationStorage } from '@/notifications/deferredNotificationStorage';
import { Navigation } from '@/navigation';
import Routes from '@rainbow-me/routes';
import { AppState as ApplicationState, AppStateStatus, NativeEventSubscription } from 'react-native';
import notifee, { Event as NotifeeEvent, EventType } from '@notifee/react-native';
import { ethereumUtils, isLowerCaseMatch } from '@/utils';
import walletTypes from '@/helpers/walletTypes';
import {
  NotificationSubscriptionChangesListener,
  registerNotificationSubscriptionChangesListener,
  resolveAndTrackPushNotificationPermissionStatus,
  trackTappedPushNotification,
  trackWalletsSubscribedForNotifications,
} from '@/notifications/analytics';
import { AddressWithRelationship, WalletNotificationRelationship } from '@/notifications/settings';
import {
  initializeGlobalNotificationSettings,
  initializeNotificationSettingsForAllAddressesAndCleanupSettingsForRemovedWallets,
} from '@/notifications/settings/initialization';
import { logger } from '@/logger';
import { transactionFetchQuery } from '@/resources/transactions/transaction';

type Callback = () => void;

type Props = PropsWithChildren<{ walletReady: boolean }>;

export const NotificationsHandler = ({ walletReady }: Props) => {
  const wallets = useWallets();
  const dispatch: ThunkDispatch<AppState, unknown, AnyAction> = useDispatch();
  const walletsRef = useRef(wallets);
  const prevWalletReady = usePrevious(walletReady);
  const subscriptionChangesListener = useRef<NotificationSubscriptionChangesListener>();
  const onTokenRefreshListener = useRef<Callback>();
  const foregroundNotificationListener = useRef<Callback>();
  const notificationOpenedListener = useRef<Callback>();
  const appStateListener = useRef<NativeEventSubscription>();
  const appState = useRef<AppStateStatus>(null);
  const notifeeForegroundEventListener = useRef<Callback>();
  const alreadyRanInitialization = useRef(false);

  /*
  We need to save wallets property to a ref in order to have an up-to-date value
  inside the event listener callbacks closure
   */
  walletsRef.current = wallets;

  const onForegroundRemoteNotification = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    const type = remoteMessage?.data?.type;
    if (type === NotificationTypes.walletConnect) {
      handleWalletConnectNotification(remoteMessage);
    } else if (remoteMessage?.notification !== undefined) {
      handleShowingForegroundNotification(remoteMessage as FixedRemoteMessage);
    }
  };

  const onBackgroundRemoteNotification = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    const type = remoteMessage?.data?.type;
    if (type === NotificationTypes.walletConnect) {
      handleWalletConnectNotification(remoteMessage);
    }
  };

  const handleWalletConnectNotification = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    const topic = remoteMessage?.data?.topic;

    setTimeout(() => {
      const requests = dispatch(requestsForTopic(topic as string));
      if (requests) {
        // WC requests will open automatically
        return false;
      }
    }, WALLETCONNECT_SYNC_DELAY);
  };

  const handleDeferredNotificationIfNeeded = useCallback(async () => {
    const notification = NotificationStorage.getDeferredNotification();
    if (notification) {
      // wait to wallet to load completely before opening
      performActionBasedOnOpenedNotificationType(notification);
      NotificationStorage.clearDeferredNotification();
    }
  }, []);

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

  const handleNotificationPressed = (event: NotifeeEvent) => {
    if (event.type === EventType.PRESS) {
      handleOpenedNotification(event.detail.notification);
    }
  };

  const handleOpenedNotification = (notification?: MinimalNotification) => {
    if (!notification) {
      return;
    }
    trackTappedPushNotification(notification);
    // Need to call getState() directly, because the event handler
    // has the old value reference in its closure
    if (!store.getState().appState.walletReady) {
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

      const wallets = walletsRef.current;
      const { accountAddress, nativeCurrency } = store.getState().settings;

      let walletAddress: string | null | undefined = accountAddress;
      if (!isLowerCaseMatch(accountAddress, data.address)) {
        walletAddress = await wallets.switchToWalletWithAddress(data.address);
      }
      if (!walletAddress) {
        return;
      }
      Navigation.handleAction(Routes.PROFILE_SCREEN, {});

      const network = ethereumUtils.getNetworkFromChainId(parseInt(data.chain, 10));
      const transaction = await transactionFetchQuery({
        hash: data.hash,
        network: network,
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
      logger.info(`NotificationsHandler: handling wallet connect notification`, { notification });
    } else if (type === NotificationTypes.marketing) {
      logger.info(`NotificationsHandler: handling marketing notification`, {
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
      logger.warn(`NotificationsHandler: received unknown notification`, {
        notification,
      });
    }
  };

  useEffect(() => {
    setupAndroidChannels();
    saveFCMToken();
    trackWalletsSubscribedForNotifications();
    subscriptionChangesListener.current = registerNotificationSubscriptionChangesListener();
    onTokenRefreshListener.current = registerTokenRefreshListener();
    foregroundNotificationListener.current = messaging().onMessage(onForegroundRemoteNotification);
    messaging().setBackgroundMessageHandler(onBackgroundRemoteNotification);
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

      Object.values(wallets.wallets ?? {}).forEach(wallet =>
        wallet?.addresses.forEach(
          ({ address, visible }: { address: string; visible: boolean }) =>
            visible &&
            addresses.push({
              address,
              relationship:
                wallet.type === walletTypes.readOnly ? WalletNotificationRelationship.WATCHER : WalletNotificationRelationship.OWNER,
            })
        )
      );
      initializeGlobalNotificationSettings();
      initializeNotificationSettingsForAllAddressesAndCleanupSettingsForRemovedWallets(addresses);

      alreadyRanInitialization.current = true;
    }
  }, [dispatch, walletReady]);

  return null;
};
