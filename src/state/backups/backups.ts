import { BackupFile, CloudBackups } from '@/model/backup';
import { createRainbowStore } from '../internal/createRainbowStore';
import { IS_ANDROID } from '@/env';
import { fetchAllBackups, getGoogleAccountUserData, isCloudBackupAvailable, syncCloud } from '@/handlers/cloudBackup';
import { RainbowError, logger } from '@/logger';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { getMostRecentCloudBackup, hasManuallyBackedUpWallet } from '@/screens/SettingsSheet/utils';
import { Mutex } from 'async-mutex';
import store from '@/redux/store';

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
const MAX_RETRIES = 3;

export const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

export const LoadingStates = [CloudBackupState.Initializing, CloudBackupState.Syncing, CloudBackupState.Fetching];

interface BackupsStore {
  timesPromptedForBackup: number;
  setTimesPromptedForBackup: (timesPromptedForBackup: number) => void;

  lastBackupPromptAt: number | undefined;
  setLastBackupPromptAt: (lastBackupPromptAt: number | undefined) => void;

  storedPassword: string;
  setStoredPassword: (storedPassword: string) => void;

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

  syncAndFetchBackups: (
    retryOnFailure?: boolean,
    retryCount?: number
  ) => Promise<{
    success: boolean;
    retry?: boolean;
  }>;
}

const returnEarlyIfLockedStates = [CloudBackupState.Syncing, CloudBackupState.Fetching];

export const backupsStore = createRainbowStore<BackupsStore>(
  (set, get) => ({
    timesPromptedForBackup: 0,
    setTimesPromptedForBackup: timesPromptedForBackup => set({ timesPromptedForBackup }),

    lastBackupPromptAt: undefined,
    setLastBackupPromptAt: lastBackupPromptAt => set({ lastBackupPromptAt }),
    storedPassword: '',
    setStoredPassword: storedPassword => set({ storedPassword }),

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

    syncAndFetchBackups: async (retryOnFailure = true, retryCount = 0) => {
      const { status } = get();

      const timeoutPromise = new Promise<{ success: boolean; retry?: boolean }>(resolve => {
        setTimeout(() => {
          resolve({ success: false, retry: retryOnFailure });
        }, DEFAULT_TIMEOUT);
      });

      const syncAndPullFiles = async (): Promise<{ success: boolean; retry?: boolean }> => {
        try {
          const isAvailable = await isCloudBackupAvailable();
          if (!isAvailable) {
            logger.debug('[backupsStore]: Cloud backup is not available');
            set({ backupProvider: undefined, status: CloudBackupState.NotAvailable, backups: { files: [] }, mostRecentBackup: undefined });
            return {
              success: false,
              retry: false,
            };
          }

          if (IS_ANDROID) {
            const gdata = await getGoogleAccountUserData(true);
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

          // See https://developers.google.com/android/reference/com/google/android/gms/auth/api/signin/GoogleSignInStatusCodes#public-static-final-int-sign_in_cancelled
          const stringifiedError = JSON.stringify(e);
          if (stringifiedError.includes('12501')) {
            logger.warn('[backupsStore]: Google sign in / oauth cancelled');
            return {
              success: false,
              retry: false,
            };
          }
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
      const { success, retry } = await Promise.race([syncAndPullFiles(), timeoutPromise]);
      releaser();
      logger.debug('[backupsStore]: Released mutex');
      if (retry && retryCount < MAX_RETRIES) {
        logger.debug(`[backupsStore]: Retrying sync and fetch backups attempt: ${retryCount + 1}`);
        return get().syncAndFetchBackups(retryOnFailure, retryCount + 1);
      }

      if (retry && retryCount >= MAX_RETRIES) {
        logger.error(new RainbowError('[backupsStore]: Max retry attempts reached. Sync failed.'));
      }

      return { success, retry };
    },
  }),
  {
    storageKey: 'backups',
    version: 0,
    partialize: state => ({
      lastBackupPromptAt: state.lastBackupPromptAt,
      timesPromptedForBackup: state.timesPromptedForBackup,
    }),
  }
);
