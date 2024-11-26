import { BackupFile, CloudBackups } from '@/model/backup';
import { createRainbowStore } from '../internal/createRainbowStore';
import { IS_ANDROID } from '@/env';
import { fetchAllBackups, getGoogleAccountUserData, isCloudBackupAvailable, syncCloud } from '@/handlers/cloudBackup';
import { RainbowError, logger } from '@/logger';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { getMostRecentCloudBackup, hasManuallyBackedUpWallet } from '@/screens/SettingsSheet/utils';
import { Mutex } from 'async-mutex';
import store from '@/redux/store';

const sleep = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const mutex = new Mutex();

export enum CloudBackupState {
  Initializing = 'initializing',
  Syncing = 'syncing',
  Fetching = 'fetching',
  FailedToInitialize = 'failed_to_initialize',
  Ready = 'ready',
  NotAvailable = 'not_available',
  InProgress = 'in_progress',
  Error = 'error',
  Success = 'success',
}

const DEFAULT_TIMEOUT = 10_000;

export const LoadingStates = [CloudBackupState.Initializing, CloudBackupState.Syncing, CloudBackupState.Fetching];

interface BackupsStore {
  backupProvider: string | undefined;
  setBackupProvider: (backupProvider: string | undefined) => void;

  status: CloudBackupState;
  setStatus: (status: CloudBackupState) => void;

  backups: CloudBackups;
  setBackups: (backups: CloudBackups) => void;

  mostRecentBackup: BackupFile | undefined;
  setMostRecentBackup: (backup: BackupFile | undefined) => void;

  password: string;
  setPassword: (password: string) => void;

  syncAndFetchBackups: (retryOnFailure?: boolean) => Promise<{
    success: boolean;
    retry?: boolean;
  }>;
}

const returnEarlyIfLockedStates = [CloudBackupState.Syncing, CloudBackupState.Fetching];

export const backupsStore = createRainbowStore<BackupsStore>((set, get) => ({
  backupProvider: undefined,
  setBackupProvider: provider => set({ backupProvider: provider }),

  status: CloudBackupState.Initializing,
  setStatus: status => set({ status }),

  backups: { files: [] },
  setBackups: backups => set({ backups }),

  mostRecentBackup: undefined,
  setMostRecentBackup: backup => set({ mostRecentBackup: backup }),

  password: '',
  setPassword: password => set({ password }),

  syncAndFetchBackups: async (retryOnFailure = true) => {
    const timeoutPromise = new Promise<{
      success: boolean;
      retry?: boolean;
    }>(resolve => {
      setTimeout(() => {
        logger.error(new RainbowError('[backupsStore]: syncAndFetchBackups timed out'));
        resolve({ success: false, retry: false });
      }, DEFAULT_TIMEOUT);
    });

    const syncPromise = (async (): Promise<{
      success: boolean;
      retry?: boolean;
    }> => {
      const { status } = get();
      const syncAndPullFiles = async (): Promise<{
        success: boolean;
        retry?: boolean;
      }> => {
        try {
          const isAvailable = await isCloudBackupAvailable();
          if (!isAvailable) {
            logger.debug('[backupsStore]: Cloud backup is not available');
            set({
              backupProvider: undefined,
              status: CloudBackupState.NotAvailable,
              backups: { files: [] },
              mostRecentBackup: undefined,
            });
            return {
              success: false,
              retry: false,
            };
          }

          if (IS_ANDROID) {
            const gdata = await getGoogleAccountUserData();
            if (!gdata) {
              logger.debug('[backupsStore]: Google account is not available');
              set({
                backupProvider: undefined,
                status: CloudBackupState.NotAvailable,
                backups: { files: [] },
                mostRecentBackup: undefined,
              });
              return {
                success: false,
                retry: false,
              };
            }
          }

          set({ status: CloudBackupState.Syncing });
          logger.debug('[backupsStore]: Syncing with cloud');
          await syncCloud();

          set({ status: CloudBackupState.Fetching });
          logger.debug('[backupsStore]: Fetching backups');
          const backups = await fetchAllBackups();

          set({ backups });

          const { wallets } = store.getState().wallets;

          // if the user has any cloud backups, set the provider to cloud
          if (backups.files.length > 0) {
            set({
              backupProvider: walletBackupTypes.cloud,
              mostRecentBackup: getMostRecentCloudBackup(backups.files),
            });
          } else if (hasManuallyBackedUpWallet(wallets)) {
            set({ backupProvider: walletBackupTypes.manual });
          } else {
            set({ backupProvider: undefined });
          }

          logger.debug(`[backupsStore]: Retrieved ${backups.files.length} backup files`);

          set({ status: CloudBackupState.Ready });
          return {
            success: true,
            retry: false,
          };
        } catch (e) {
          logger.error(new RainbowError('[backupsStore]: Failed to fetch all backups'), {
            error: e,
          });
          set({ status: CloudBackupState.FailedToInitialize });
        }

        return {
          success: false,
          retry: retryOnFailure,
        };
      };

      if (mutex.isLocked() || returnEarlyIfLockedStates.includes(status)) {
        logger.debug('[backupsStore]: Mutex is locked or returnEarlyIfLockedStates includes status', {
          status,
        });
        return {
          success: false,
          retry: false,
        };
      }

      const releaser = await mutex.acquire();
      logger.debug('[backupsStore]: Acquired mutex');
      const { success, retry } = await syncAndPullFiles();
      releaser();
      logger.debug('[backupsStore]: Released mutex');
      if (retry) {
        await sleep(5_000);
        return get().syncAndFetchBackups(retryOnFailure);
      }
      return { success, retry };
    })();

    return Promise.race([syncPromise, timeoutPromise]);
  },
}));
