import { EventEmitter } from 'events';
import BackupStateTypes from '../helpers/backupStateTypes';
import { Navigation } from '../navigation';
import { addNewSubscriber } from '../redux/data';
import store from '../redux/store';
import { checkKeychainIntegrity } from '../redux/wallets';
import {
  getKeychainIntegrityState,
  getUserBackupState,
  saveKeychainIntegrityState,
  saveUserBackupState,
} from './localstorage/globalSettings';
import Routes from '@rainbow-me/routes';

const BACKUP_SHEET_DELAY_MS = 3000;

export const runKeychainIntegrityChecks = () => {
  setTimeout(async () => {
    const keychainIntegrityState = await getKeychainIntegrityState();
    if (!keychainIntegrityState) {
      await store.dispatch(checkKeychainIntegrity());
      await saveKeychainIntegrityState('done');
    }
  }, 5000);
};

export const setupIncomingNotificationListeners = async () => {
  let incomingTxListener = null;
  // Previously existing users should see the backup sheet right after app launch
  // Uncomment the line below to get in the existing user state(before icloud)
  const backupState = await getUserBackupState();
  if (null === BackupStateTypes.immediate) {
    setTimeout(() => {
      Navigation.handleAction(Routes.BACKUP_SHEET, {
        option: 'existing_user',
      });
    }, BACKUP_SHEET_DELAY_MS);
    // New users who get an incoming tx
    // now need to go through the backup flow
  } else if (backupState === BackupStateTypes.ready) {
    incomingTxListener = new EventEmitter();
    incomingTxListener.on('incoming_transaction', async type => {
      await saveUserBackupState(BackupStateTypes.pending);
      setTimeout(
        () => {
          Navigation.handleAction(Routes.BACKUP_SHEET);
        },
        type === 'appended' ? 30000 : BACKUP_SHEET_DELAY_MS
      );
      incomingTxListener.removeAllListeners();
    });
    // Incoming handles new transactions during runtime
    store.dispatch(addNewSubscriber(incomingTxListener, 'appended'));
    // Received will trigger when there's incoming transactions
    // during startup
    store.dispatch(addNewSubscriber(incomingTxListener, 'received'));
  } else if (backupState === BackupStateTypes.pending) {
    setTimeout(() => {
      Navigation.handleAction(Routes.BACKUP_SHEET);
    }, BACKUP_SHEET_DELAY_MS);
  }

  return incomingTxListener;
};
