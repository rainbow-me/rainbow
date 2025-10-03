import RNFS from 'react-native-fs';
import { MMKV } from 'react-native-mmkv';
import { RainbowError, logger } from '@/logger';
import { time } from '@/utils/time';
import { RAINBOW_HOME } from './constants';
import { ScreenshotType, TabData, TabId } from './types';

// ============ Storage ======================================================== //

export const tabScreenshotStorage = new MMKV();

// ============ Operation Queue ================================================ //

const screenshotOperationLock = { pending: Promise.resolve<void | ScreenshotType | null>(null) };

// ============ Constants ====================================================== //

const FILE_EXTENSION = '.jpg';
const FILE_PREFIX = 'screenshot-';

const MMKV_KEY = 'tabScreenshots';
const MMKV_LAST_FULL_CLEANUP_KEY = 'lastFullCleanup';

const DEEP_PRUNE_INTERVAL = time.days(1);
const PRUNE_BATCH_SIZE = 20;

// ============ Screenshot Retrieval =========================================== //

export function findTabScreenshot(id: string, url?: string): ScreenshotType | null {
  if (!url || url === RAINBOW_HOME) return null;

  const screenshots = getStoredScreenshots();
  const matchingScreenshots = screenshots.filter(screenshot => screenshot.id === id && screenshot.url === url);

  if (matchingScreenshots.length) {
    const mostRecentScreenshot = matchingScreenshots.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
    return {
      ...mostRecentScreenshot,
      uri: `${RNFS.DocumentDirectoryPath}/${mostRecentScreenshot.uri}`,
    };
  }

  return null;
}

function getStoredScreenshots(): ScreenshotType[] {
  const persistedScreenshots = tabScreenshotStorage.getString(MMKV_KEY);
  if (!persistedScreenshots) return [];

  try {
    const parsed = JSON.parse(persistedScreenshots);

    if (!Array.isArray(parsed)) {
      logger.error(new RainbowError('[DappBrowser]: Screenshot data is malformed — expected array. Resetting storage.'));
      tabScreenshotStorage.delete(MMKV_KEY);
      return [];
    }

    return parsed;
  } catch (error) {
    logger.error(new RainbowError('[DappBrowser]: Screenshot data is corrupted — invalid JSON. Resetting storage.'), { error });
    tabScreenshotStorage.delete(MMKV_KEY);
    return [];
  }
}

// ============ Saving ========================================================= //

export async function saveScreenshot(tempUri: string, tabId: string, timestamp: number, url: string): Promise<ScreenshotType | null> {
  const fileName = buildFilePath(timestamp);

  screenshotOperationLock.pending = screenshotOperationLock.pending.then(async () => {
    try {
      await RNFS.copyFile(tempUri, `${RNFS.DocumentDirectoryPath}/${fileName}`);
      const newScreenshot: ScreenshotType = { id: tabId, timestamp, uri: fileName, url };

      const screenshots = getStoredScreenshots();
      screenshots.push(newScreenshot);
      tabScreenshotStorage.set(MMKV_KEY, JSON.stringify(screenshots));

      return { ...newScreenshot, uri: `${RNFS.DocumentDirectoryPath}/${fileName}` };
    } catch (error) {
      await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${fileName}`).catch(() => {
        return;
      });
      logger.error(new RainbowError('[DappBrowser]: Error saving tab screenshot', error), { tabId, url });
      return null;
    }
  });

  return screenshotOperationLock.pending as Promise<ScreenshotType | null>;
}

// ============ Pruning ======================================================== //

export function schedulePruneScreenshots(tabsData: Map<TabId, TabData>): () => void {
  let shallowPruneCallbackId: number;
  let deepPruneCallbackId: number;

  const timeoutId = setTimeout(() => {
    shallowPruneCallbackId = requestIdleCallback(async () => {
      await pruneScreenshots(tabsData);
      deepPruneCallbackId = requestIdleCallback(() => {
        pruneOrphanedScreenshots();
      });
    });
  }, time.seconds(10));

  return () => {
    clearTimeout(timeoutId);
    if (typeof shallowPruneCallbackId === 'number') cancelIdleCallback(shallowPruneCallbackId);
    if (typeof deepPruneCallbackId === 'number') cancelIdleCallback(deepPruneCallbackId);
  };
}

async function pruneScreenshots(tabsData: Map<TabId, TabData>): Promise<void> {
  screenshotOperationLock.pending = screenshotOperationLock.pending.then(async () => {
    const screenshots = getStoredScreenshots();

    const screenshotsToKeep: Partial<Record<string, ScreenshotType>> = {};
    const screenshotsToDelete: ScreenshotType[] = [];

    screenshots.forEach(screenshot => {
      const isActiveTabWithMatchingUrl = tabsData.get(screenshot.id)?.url === screenshot.url;

      if (isActiveTabWithMatchingUrl) {
        const existing = screenshotsToKeep[screenshot.id];
        if (!existing || existing.timestamp < screenshot.timestamp) {
          if (existing) screenshotsToDelete.push(existing);
          screenshotsToKeep[screenshot.id] = screenshot;
        } else {
          screenshotsToDelete.push(screenshot);
        }
      } else {
        screenshotsToDelete.push(screenshot);
      }
    });

    if (screenshotsToDelete.length) {
      const filesToDelete = screenshotsToDelete.map(s => `${RNFS.DocumentDirectoryPath}/${s.uri}`);
      await deleteFilesInBatches(filesToDelete);
    }

    tabScreenshotStorage.set(MMKV_KEY, JSON.stringify(Object.values(screenshotsToKeep)));
  });

  await screenshotOperationLock.pending;
}

/**
 * Finds and cleans up any orphaned screenshots
 * that are not registered in `tabScreenshotStorage`.
 */
async function pruneOrphanedScreenshots(): Promise<void> {
  try {
    const lastCleanup = tabScreenshotStorage.getNumber(MMKV_LAST_FULL_CLEANUP_KEY) ?? 0;
    const now = Date.now();

    if (now - lastCleanup < DEEP_PRUNE_INTERVAL) return;

    const screenshotFiles = await getScreenshotFiles();
    const trackedScreenshots = getStoredScreenshots();
    const trackedFileNames = new Set(trackedScreenshots.map(s => s.uri));
    const orphanedFiles = screenshotFiles.filter(file => !trackedFileNames.has(file.name));

    if (!orphanedFiles.length) {
      tabScreenshotStorage.set(MMKV_LAST_FULL_CLEANUP_KEY, now);
      return;
    }

    await deleteFilesInBatches(orphanedFiles.map(f => f.path));
    tabScreenshotStorage.set(MMKV_LAST_FULL_CLEANUP_KEY, now);
  } catch (error) {
    logger.error(new RainbowError('[DappBrowser]: Orphaned screenshot cleanup failed', error));
  }
}

// ============ Utilities ====================================================== //

function buildFilePath(timestamp: number): string {
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${FILE_PREFIX}${timestamp}-${random}${FILE_EXTENSION}`;
}

async function getScreenshotFiles(): Promise<RNFS.ReadDirItem[]> {
  const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
  return files.filter(file => file.name.startsWith(FILE_PREFIX));
}

async function deleteFilesInBatches(filePaths: string[]): Promise<void> {
  for (let i = 0; i < filePaths.length; i += PRUNE_BATCH_SIZE) {
    const batch = filePaths.slice(i, i + PRUNE_BATCH_SIZE);
    const deletePromises = batch.map(filePath =>
      RNFS.unlink(filePath).catch(error => {
        logger.error(new RainbowError('[DappBrowser]: Error deleting screenshot file', error), {
          filePath,
        });
      })
    );
    await Promise.allSettled(deletePromises);

    if (i + PRUNE_BATCH_SIZE < filePaths.length) {
      await new Promise(resolve => {
        setTimeout(resolve, 50);
      });
    }
  }
}
