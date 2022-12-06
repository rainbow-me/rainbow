import {
  addDefaultNotificationGroupSettings,
  NotificationRelationship,
  notificationSettingsStorage,
  WALLET_GROUPS_STORAGE_KEY,
  WALLET_TOPICS_STORAGE_KEY,
} from '@/notifications/settings';
import { InteractionManager } from 'react-native';
import {
  DEFAULT_ENABLED_TOPIC_SETTINGS,
  NOTIFICATIONS_DEFAULT_CHAIN_ID,
} from '@/notifications/settings/constants';
import {
  _prepareInitializationState,
  _prepareSubscriptionQueueAndCreateInitialSettings,
  _processSubscriptionQueue,
} from '@/notifications/settings/initialization';
import {
  subscribeWalletToAllEnabledTopics,
  unsubscribeWalletFromAllNotificationTopics,
} from '@/notifications/settings/firebase';

const TEST_ADDRESS_1 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const TEST_ADDRESS_2 = '0xe5501bc2b0df6d0d7daafc18d2ef127d9e612963';
const EMPTY_INIT_STATE = {
  newSettings: [],
  alreadySaved: new Map(),
  subscriptionQueue: [],
};

// @ts-ignore just for the mock
InteractionManager.runAfterInteractions = jest.fn(cb => {
  if (typeof cb === 'function') {
    cb();
  } else {
    cb?.gen();
  }
});

jest.mock('@/redux/explorer', () => ({
  notificationsSubscription: jest.fn(),
}));

jest.mock('@/redux/store', () => ({
  dispatch: jest.fn(),
}));

jest.mock('@/notifications/settings/firebase', () => ({
  subscribeWalletToAllEnabledTopics: jest.fn(() => Promise.resolve()),
  unsubscribeWalletFromAllNotificationTopics: jest.fn(() => Promise.resolve()),
  unsubscribeWalletFromSingleNotificationTopic: jest.fn(() =>
    Promise.resolve()
  ),
  subscribeWalletToSingleNotificationTopic: jest.fn(() => Promise.resolve()),
}));

describe('Notification settings, groups initialization', function () {
  test('adding default group settings if they do not exist in MMKV', () => {
    notificationSettingsStorage.delete(WALLET_GROUPS_STORAGE_KEY);
    const before = notificationSettingsStorage.getString(
      WALLET_GROUPS_STORAGE_KEY
    );
    expect(before).toBeUndefined();
    addDefaultNotificationGroupSettings();
    const after = notificationSettingsStorage.getString(
      WALLET_GROUPS_STORAGE_KEY
    );
    expect(after).toEqual('{"owner":true,"watcher":false}');
  });
});

describe('Notification settings, wallet settings initialization', () => {
  beforeEach(() => {
    notificationSettingsStorage.delete(WALLET_TOPICS_STORAGE_KEY);
    jest.resetAllMocks();
  });

  test('initializing settings when list of wallets is empty and the stored state is not initialized', () => {
    const before = notificationSettingsStorage.getString(
      WALLET_TOPICS_STORAGE_KEY
    );
    expect(before).toBeUndefined();

    const initState = _prepareInitializationState();
    expect(initState).toEqual(EMPTY_INIT_STATE);
    const queue = _prepareSubscriptionQueueAndCreateInitialSettings(
      [],
      initState
    );
    expect(queue).toEqual([]);

    const after = notificationSettingsStorage.getString(
      WALLET_TOPICS_STORAGE_KEY
    );
    expect(after).toEqual('[]');
  });

  test('initializing settings when there are wallets to initialize (updated app) but settings are not stored yet', () => {
    const storedBefore = notificationSettingsStorage.getString(
      WALLET_TOPICS_STORAGE_KEY
    );
    expect(storedBefore).toBeUndefined();
    const initState = _prepareInitializationState();
    expect(initState).toEqual(EMPTY_INIT_STATE);
    const queue = _prepareSubscriptionQueueAndCreateInitialSettings(
      [
        {
          address: TEST_ADDRESS_1,
          relationship: NotificationRelationship.OWNER,
        },
        {
          address: TEST_ADDRESS_2,
          relationship: NotificationRelationship.WATCHER,
        },
      ],
      initState
    );
    expect(queue).toEqual([
      {
        address: TEST_ADDRESS_1,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        type: NotificationRelationship.OWNER,
        successfullyFinishedInitialSubscription: false,
        enabled: false,
      },
    ]);
    const storedAfter = JSON.parse(
      notificationSettingsStorage.getString(WALLET_TOPICS_STORAGE_KEY) ?? '[]'
    );
    expect(storedAfter).toEqual([
      {
        address: TEST_ADDRESS_1,
        type: NotificationRelationship.OWNER,
        successfullyFinishedInitialSubscription: false,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        enabled: false,
      },
      {
        address: TEST_ADDRESS_2,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        type: NotificationRelationship.WATCHER,
        successfullyFinishedInitialSubscription: true,
        enabled: false,
      },
    ]);
  });

  test('initializing settings when there are only watched wallets to initialize (updated app) but settings are not stored yet', () => {
    const storedBefore = notificationSettingsStorage.getString(
      WALLET_TOPICS_STORAGE_KEY
    );
    expect(storedBefore).toBeUndefined();
    const initState = _prepareInitializationState();
    expect(initState).toEqual(EMPTY_INIT_STATE);
    const queue = _prepareSubscriptionQueueAndCreateInitialSettings(
      [
        {
          address: TEST_ADDRESS_1,
          relationship: NotificationRelationship.WATCHER,
        },
        {
          address: TEST_ADDRESS_2,
          relationship: NotificationRelationship.WATCHER,
        },
      ],
      initState
    );
    expect(queue).toEqual([]);
    const storedAfter = JSON.parse(
      notificationSettingsStorage.getString(WALLET_TOPICS_STORAGE_KEY) ?? '[]'
    );
    expect(storedAfter).toEqual([
      {
        address: TEST_ADDRESS_1,
        type: NotificationRelationship.WATCHER,
        successfullyFinishedInitialSubscription: true,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        enabled: false,
      },
      {
        address: TEST_ADDRESS_2,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        type: NotificationRelationship.WATCHER,
        successfullyFinishedInitialSubscription: true,
        enabled: false,
      },
    ]);
  });

  test('running initialization when it was already successfully initialized before and no work needs to be done', () => {
    const before = notificationSettingsStorage.getString(
      WALLET_TOPICS_STORAGE_KEY
    );
    expect(before).toBeUndefined();
    const stateBefore = [
      {
        address: TEST_ADDRESS_1,
        type: NotificationRelationship.OWNER,
        successfullyFinishedInitialSubscription: true,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        enabled: true,
      },
      {
        address: TEST_ADDRESS_2,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        type: NotificationRelationship.WATCHER,
        successfullyFinishedInitialSubscription: true,
        enabled: false,
      },
    ];
    notificationSettingsStorage.set(
      WALLET_TOPICS_STORAGE_KEY,
      JSON.stringify(stateBefore)
    );
    const initState = _prepareInitializationState();
    expect(initState).toEqual({
      newSettings: stateBefore,
      subscriptionQueue: [],
      alreadySaved: new Map([
        [
          TEST_ADDRESS_1,
          {
            index: 0,
            settings: stateBefore[0],
          },
        ],
        [
          TEST_ADDRESS_2,
          {
            index: 1,
            settings: stateBefore[1],
          },
        ],
      ]),
    });
    const queue = _prepareSubscriptionQueueAndCreateInitialSettings(
      [
        {
          address: TEST_ADDRESS_1,
          relationship: NotificationRelationship.OWNER,
        },
        {
          address: TEST_ADDRESS_2,
          relationship: NotificationRelationship.WATCHER,
        },
      ],
      initState
    );

    expect(queue).toEqual([]);

    const stateAfter = JSON.parse(
      notificationSettingsStorage.getString(WALLET_TOPICS_STORAGE_KEY) ?? '[]'
    );
    expect(stateAfter).toEqual(stateBefore);
  });

  test('running initialization when it was already initialized before but one of the wallets failed to subscribe properly', () => {
    const before = notificationSettingsStorage.getString(
      WALLET_TOPICS_STORAGE_KEY
    );
    expect(before).toBeUndefined();
    const stateBefore = [
      {
        address: TEST_ADDRESS_1,
        type: NotificationRelationship.OWNER,
        // failed to subscribe properly, that's why it's still false
        successfullyFinishedInitialSubscription: false,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        enabled: true,
      },
      {
        address: TEST_ADDRESS_2,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        type: NotificationRelationship.WATCHER,
        successfullyFinishedInitialSubscription: true,
        enabled: false,
      },
    ];
    notificationSettingsStorage.set(
      WALLET_TOPICS_STORAGE_KEY,
      JSON.stringify(stateBefore)
    );
    const initState = _prepareInitializationState();
    expect(initState).toEqual({
      newSettings: stateBefore,
      subscriptionQueue: [],
      alreadySaved: new Map([
        [
          TEST_ADDRESS_1,
          {
            index: 0,
            settings: stateBefore[0],
          },
        ],
        [
          TEST_ADDRESS_2,
          {
            index: 1,
            settings: stateBefore[1],
          },
        ],
      ]),
    });
    const queue = _prepareSubscriptionQueueAndCreateInitialSettings(
      [
        {
          address: TEST_ADDRESS_1,
          relationship: NotificationRelationship.OWNER,
        },
        {
          address: TEST_ADDRESS_2,
          relationship: NotificationRelationship.WATCHER,
        },
      ],
      initState
    );

    expect(queue).toEqual([stateBefore[0]]);

    const stateAfter = JSON.parse(
      notificationSettingsStorage.getString(WALLET_TOPICS_STORAGE_KEY) ?? '[]'
    );
    // unchanged because the work will happen when queue i processed
    expect(stateAfter).toEqual(stateBefore);
  });

  test('running initialization when it was already initialized before, but one of the watched wallets was imported with seed phrase or private key', () => {
    const initialState = notificationSettingsStorage.getString(
      WALLET_TOPICS_STORAGE_KEY
    );
    expect(initialState).toBeUndefined();
    const stateBefore = [
      {
        address: TEST_ADDRESS_1,
        // before the wallet is a watched one
        type: NotificationRelationship.WATCHER,
        // it was properly initialized before
        successfullyFinishedInitialSubscription: true,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        enabled: false,
      },
      {
        address: TEST_ADDRESS_2,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        type: NotificationRelationship.WATCHER,
        successfullyFinishedInitialSubscription: true,
        enabled: false,
      },
    ];
    notificationSettingsStorage.set(
      WALLET_TOPICS_STORAGE_KEY,
      JSON.stringify(stateBefore)
    );
    const initState = _prepareInitializationState();
    expect(initState).toEqual({
      newSettings: stateBefore,
      subscriptionQueue: [],
      alreadySaved: new Map([
        [
          TEST_ADDRESS_1,
          {
            index: 0,
            settings: stateBefore[0],
          },
        ],
        [
          TEST_ADDRESS_2,
          {
            index: 1,
            settings: stateBefore[1],
          },
        ],
      ]),
    });
    const queue = _prepareSubscriptionQueueAndCreateInitialSettings(
      [
        {
          address: TEST_ADDRESS_1,
          // changed to be owned from watched wallet
          relationship: NotificationRelationship.OWNER,
        },
        {
          address: TEST_ADDRESS_2,
          relationship: NotificationRelationship.WATCHER,
        },
      ],
      initState
    );

    // changed the current type to "owned" and old to "watched" (previous state), also wallet now is not initialized since it needs to re-subscribe
    const changedState = {
      type: NotificationRelationship.OWNER,
      oldType: NotificationRelationship.WATCHER,
      successfullyFinishedInitialSubscription: false,
    };

    expect(queue).toEqual([
      {
        ...stateBefore[0],
        ...changedState,
      },
    ]);

    const stateAfter = JSON.parse(
      notificationSettingsStorage.getString(WALLET_TOPICS_STORAGE_KEY) ?? '[]'
    );
    // unchanged because the work will happen when queue i processed
    expect(stateAfter).toEqual([
      {
        ...stateBefore[0],
        ...changedState,
      },
      stateBefore[1],
    ]);
  });
});

describe('Notification settings, subscription queue processing implementation', () => {
  beforeEach(() => {
    notificationSettingsStorage.delete(WALLET_TOPICS_STORAGE_KEY);
    jest.resetAllMocks();
  });

  test('running a subscription queue with no items in it causes zero effects', async () => {
    const before = notificationSettingsStorage.getString(
      WALLET_TOPICS_STORAGE_KEY
    );
    expect(before).toBeUndefined();
    notificationSettingsStorage.set(
      WALLET_TOPICS_STORAGE_KEY,
      JSON.stringify([
        {
          address: TEST_ADDRESS_1,
          type: NotificationRelationship.OWNER,
          successfullyFinishedInitialSubscription: false,
          topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
          enabled: false,
        },
      ])
    );

    await _processSubscriptionQueue([]);
    expect(
      JSON.parse(
        notificationSettingsStorage.getString(WALLET_TOPICS_STORAGE_KEY) ?? '[]'
      )
    ).toEqual([
      {
        address: TEST_ADDRESS_1,
        type: NotificationRelationship.OWNER,
        successfullyFinishedInitialSubscription: false,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        enabled: false,
      },
    ]);
  });

  test('running subscription queue processing for items that were not yet properly subscribed with firebase should subscribe them properly', async () => {
    const before = notificationSettingsStorage.getString(
      WALLET_TOPICS_STORAGE_KEY
    );
    expect(before).toBeUndefined();
    notificationSettingsStorage.set(
      WALLET_TOPICS_STORAGE_KEY,
      JSON.stringify([
        {
          address: TEST_ADDRESS_1,
          type: NotificationRelationship.OWNER,
          successfullyFinishedInitialSubscription: false,
          topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
          enabled: false,
        },
      ])
    );

    await _processSubscriptionQueue([
      {
        address: TEST_ADDRESS_1,
        type: NotificationRelationship.OWNER,
        successfullyFinishedInitialSubscription: false,
        topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
        enabled: false,
      },
    ]);
    const stateAfter = {
      address: TEST_ADDRESS_1,
      type: NotificationRelationship.OWNER,
      successfullyFinishedInitialSubscription: true,
      topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
      enabled: true,
    };
    expect(subscribeWalletToAllEnabledTopics).toHaveBeenCalledWith(
      stateAfter,
      NOTIFICATIONS_DEFAULT_CHAIN_ID
    );
    expect(
      JSON.parse(
        notificationSettingsStorage.getString(WALLET_TOPICS_STORAGE_KEY) ?? '[]'
      )
    ).toEqual([stateAfter]);
  });

  test('running subscription queue processing for wallets that were imported after being watched should unsubscribe them completely and resubscribe them properly again', async () => {
    const before = notificationSettingsStorage.getString(
      WALLET_TOPICS_STORAGE_KEY
    );
    expect(before).toBeUndefined();
    const stateBefore = {
      address: TEST_ADDRESS_1,
      type: NotificationRelationship.OWNER,
      // has old type as "watcher" which signifies that it was previously watched
      oldType: NotificationRelationship.WATCHER,
      successfullyFinishedInitialSubscription: false,
      topics: DEFAULT_ENABLED_TOPIC_SETTINGS,
      enabled: false,
    };
    notificationSettingsStorage.set(
      WALLET_TOPICS_STORAGE_KEY,
      JSON.stringify([stateBefore])
    );

    await _processSubscriptionQueue([stateBefore]);
    const stateAfter = {
      ...stateBefore,
      successfullyFinishedInitialSubscription: true,
      enabled: true,
      oldType: undefined,
    };
    expect(unsubscribeWalletFromAllNotificationTopics).toHaveBeenCalledWith(
      NotificationRelationship.WATCHER,
      NOTIFICATIONS_DEFAULT_CHAIN_ID,
      stateBefore.address
    );
    expect(subscribeWalletToAllEnabledTopics).toHaveBeenCalledWith(
      stateAfter,
      NOTIFICATIONS_DEFAULT_CHAIN_ID
    );

    expect(
      JSON.parse(
        notificationSettingsStorage.getString(WALLET_TOPICS_STORAGE_KEY) ?? '[]'
      )
    ).toEqual([stateAfter]);
  });
});
