import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useContacts, usePrevious, useWallets } from '@/hooks';
import { setupAndroidChannels } from '@/notifications/setupAndroidChannels';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import {
  FixedRemoteMessage,
  MinimalNotification,
  NotificationTypes,
  TransactionNotificationData,
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
import { getProviderForNetwork } from '@/handlers/web3';
import { ethereumUtils, isLowerCaseMatch } from '@/utils';
import { NewTransactionOrAddCashTransaction } from '@/entities/transactions/transaction';
import { TransactionDirection, TransactionStatus } from '@/entities';
import { showTransactionDetailsSheet } from '@/handlers/transactions';
import { getTitle, getTransactionLabel, parseNewTransaction } from '@/parsers';
import { isZero } from '@/helpers/utilities';
import { getConfirmedState } from '@/helpers/transactions';
import { mapNotificationTransactionType } from '@/notifications/mapTransactionsType';
import walletTypes from '@/helpers/walletTypes';
import {
  NotificationSubscriptionChangesListener,
  registerNotificationSubscriptionChangesListener,
  resolveAndTrackPushNotificationPermissionStatus,
  trackTappedPushNotification,
  trackWalletsSubscribedForNotifications,
} from '@/notifications/analytics';
import {
  NotificationRelationship,
  AddressWithRelationship,
  initializeAllWalletsWithEmptySettings,
} from '@/notifications/settings';

type Callback = () => void;

type Props = PropsWithChildren<{ walletReady: boolean }>;

export const NotificationsHandler = ({ walletReady }: Props) => {
  const wallets = useWallets();
  const { contacts } = useContacts();
  const dispatch: ThunkDispatch<AppState, unknown, AnyAction> = useDispatch();
  const syncedStateRef = useRef({
    wallets,
    contacts,
  });
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
  We need to save some properties to a ref in order to have an up-to-date value
  inside the event listener callbacks closure
   */
  syncedStateRef.current.wallets = wallets;
  syncedStateRef.current.contacts = contacts;

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

  const handleDeferredNotificationIfNeeded = useCallback(async () => {
    const notification = NotificationStorage.getDeferredNotification();
    if (notification) {
      // wait to wallet to load completely before opening
      performActionBasedOnOpenedNotificationType(notification);
      NotificationStorage.clearDeferredNotification();
    }
  }, []);

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
    trackTappedPushNotification(notification);
    // Need to call getState() directly, because the event handler
    // has the old value reference in its closure
    if (!store.getState().appState.walletReady) {
      NotificationStorage.deferNotification(notification);
      return;
    }
    performActionBasedOnOpenedNotificationType(notification);
  };

  const performActionBasedOnOpenedNotificationType = async (
    notification: MinimalNotification
  ) => {
    const type = notification?.data?.type;

    if (type === NotificationTypes.transaction) {
      const untypedData = notification?.data;
      if (
        !untypedData?.address ||
        !untypedData?.hash ||
        !untypedData?.chain ||
        !untypedData?.transaction_type
      ) {
        return;
      }

      // casting data payload to type that was agreed on with backend
      const data = (notification.data as unknown) as TransactionNotificationData;

      const { wallets, contacts } = syncedStateRef.current;
      const { accountAddress, nativeCurrency } = store.getState().settings;

      let walletAddress: string | null | undefined = accountAddress;
      if (!isLowerCaseMatch(accountAddress, data.address)) {
        walletAddress = await wallets.switchToWalletWithAddress(data.address);
      }
      if (!walletAddress) {
        return;
      }
      Navigation.handleAction(Routes.PROFILE_SCREEN, {});
      const zerionTransaction = store
        .getState()
        .data.transactions.find(tx =>
          isLowerCaseMatch(ethereumUtils.getHash(tx) ?? '', data.hash)
        );
      if (zerionTransaction) {
        showTransactionDetailsSheet(zerionTransaction, contacts, walletAddress);
      } else {
        const network = ethereumUtils.getNetworkFromChainId(
          parseInt(data.chain, 10)
        );
        const provider = await getProviderForNetwork(network);
        const rpcTransaction = await provider.getTransaction(data.hash);

        const transactionConfirmed =
          rpcTransaction?.blockNumber && rpcTransaction?.blockHash;
        if (!transactionConfirmed) {
          return;
        }

        const newTransactionDetails: NewTransactionOrAddCashTransaction = {
          type: mapNotificationTransactionType(data.transaction_type),
          network,
          hash: rpcTransaction.hash,
          status: TransactionStatus.unknown,
          amount: rpcTransaction.value.toString(),
          nonce: rpcTransaction.nonce,
          from: rpcTransaction.from,
          to: rpcTransaction.to ?? null,
          asset: null,
          gasLimit: rpcTransaction.gasLimit,
          maxFeePerGas: rpcTransaction.maxFeePerGas,
          maxPriorityFeePerGas: rpcTransaction.maxPriorityFeePerGas,
          gasPrice: rpcTransaction.gasPrice,
          data: rpcTransaction.data,
        };

        const parsedTransaction = await parseNewTransaction(
          newTransactionDetails,
          nativeCurrency
        );
        const resultTransaction = { ...parsedTransaction };
        const minedAt = Math.floor(Date.now() / 1000);
        let receipt;

        try {
          if (rpcTransaction) {
            receipt = await rpcTransaction.wait();
          }
        } catch (e: any) {
          // https://docs.ethers.io/v5/api/providers/types/#providers-TransactionResponse
          if (e.transaction) {
            // if a transaction field exists, it was confirmed but failed
            resultTransaction.status = TransactionStatus.failed;
          } else {
            // cancelled or replaced
            resultTransaction.status = TransactionStatus.cancelled;
          }
        }
        const status = receipt?.status || 0;
        if (!isZero(status)) {
          let direction = TransactionDirection.out;
          if (
            parsedTransaction?.from &&
            parsedTransaction?.to &&
            isLowerCaseMatch(parsedTransaction.from, parsedTransaction.to)
          ) {
            direction = TransactionDirection.self;
          }
          if (
            parsedTransaction?.from &&
            parsedTransaction?.to &&
            isLowerCaseMatch(walletAddress, parsedTransaction.to)
          ) {
            direction = TransactionDirection.in;
          }

          const newStatus = getTransactionLabel({
            direction,
            pending: false,
            protocol: parsedTransaction?.protocol,
            status:
              parsedTransaction.status === TransactionStatus.cancelling
                ? TransactionStatus.cancelled
                : getConfirmedState(parsedTransaction.type),
            type: parsedTransaction?.type,
          });
          resultTransaction.status = newStatus;
        } else {
          resultTransaction.status = TransactionStatus.failed;
        }
        resultTransaction.title = getTitle({
          protocol: parsedTransaction.protocol,
          status: resultTransaction.status,
          type: parsedTransaction.type,
        });
        resultTransaction.pending = false;
        resultTransaction.minedAt = minedAt;

        if (resultTransaction) {
          showTransactionDetailsSheet(
            resultTransaction,
            contacts,
            walletAddress
          );
        }
      }
    }
  };

  const addresses = useMemo(() => {
    const addresses: AddressWithRelationship[] = [];
    Object.values(wallets.wallets || {}).forEach(wallet =>
      wallet?.addresses.forEach(
        ({ address, visible }: { address: string; visible: boolean }) =>
          visible &&
          addresses.push({
            address,
            relationship:
              wallet.type === walletTypes.readOnly
                ? NotificationRelationship.WATCHER
                : NotificationRelationship.OWNER,
          })
      )
    );
    return addresses;
  }, [wallets]);

  useEffect(() => {
    setupAndroidChannels();
    saveFCMToken();
    trackWalletsSubscribedForNotifications();
    subscriptionChangesListener.current = registerNotificationSubscriptionChangesListener();
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

  // Initializing MMKV storage with empty settings for all wallets that weren't yet initialized
  useEffect(() => {
    if (walletReady && !alreadyRanInitialization.current) {
      initializeAllWalletsWithEmptySettings(addresses, dispatch);
      alreadyRanInitialization.current = true;
    }
  }, [addresses, dispatch, walletReady]);

  return null;
};
