import { RainbowError, logger } from '@/logger';
import { MMKV } from 'react-native-mmkv';
import RNFS from 'react-native-fs';
import { TabState } from './BrowserContext';

export const tabScreenshotStorage = new MMKV();

export interface ScreenshotType {
  id: string; // <- the tab uniqueId
  timestamp: number; // <- time of capture
  uri: string; // <- screenshot file name = `screenshot-${timestamp}.jpg`
  url: string; // <- url of the tab
}

export const getStoredScreenshots = (): ScreenshotType[] => {
  const persistedScreenshots = tabScreenshotStorage.getString('tabScreenshots');
  return persistedScreenshots ? (JSON.parse(persistedScreenshots) as ScreenshotType[]) : [];
};

export const findTabScreenshot = (id: string, url: string): ScreenshotType | null => {
  const persistedData = tabScreenshotStorage.getString('tabScreenshots');
  if (persistedData) {
    const screenshots = JSON.parse(persistedData);

    if (!Array.isArray(screenshots)) {
      try {
        logger.error(new RainbowError('Screenshot data is malformed — expected array'), {
          screenshots: JSON.stringify(screenshots, null, 2),
        });
      } catch (e: any) {
        logger.error(new RainbowError('Screenshot data is malformed — error stringifying'), {
          message: e.message,
        });
      }
      return null;
    }

    const matchingScreenshots = screenshots.filter(screenshot => screenshot.id === id);
    const screenshotsWithMatchingUrl = matchingScreenshots.filter(screenshot => screenshot.url === url);

    if (screenshotsWithMatchingUrl.length > 0) {
      const mostRecentScreenshot = screenshotsWithMatchingUrl.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
      return {
        ...mostRecentScreenshot,
        uri: `${RNFS.DocumentDirectoryPath}/${mostRecentScreenshot.uri}`,
      };
    }
  }

  return null;
};

export const pruneScreenshots = async (tabStates: TabState[]): Promise<void> => {
  const tabStateMap = tabStates.reduce((acc: Record<string, string>, tab: TabState) => {
    acc[tab.uniqueId] = tab.url;
    return acc;
  }, {});

  const persistedData = tabScreenshotStorage.getString('tabScreenshots');
  if (!persistedData) return;

  const screenshots: ScreenshotType[] = JSON.parse(persistedData) || [];
  const screenshotsGroupedByTabId: Record<string, ScreenshotType[]> = screenshots.reduce(
    (acc: Record<string, ScreenshotType[]>, screenshot: ScreenshotType) => {
      if (tabStateMap[screenshot.id]) {
        if (!acc[screenshot.id]) acc[screenshot.id] = [];
        acc[screenshot.id].push(screenshot);
      }
      return acc;
    },
    {}
  );

  const screenshotsToKeep: ScreenshotType[] = Object.values(screenshotsGroupedByTabId)
    .map((group: ScreenshotType[]) => {
      return group.reduce((mostRecent: ScreenshotType, current: ScreenshotType) => {
        return new Date(mostRecent.timestamp) > new Date(current.timestamp) ? mostRecent : current;
      });
    })
    .filter((screenshot: ScreenshotType) => tabStateMap[screenshot.id] === screenshot.url);

  await deletePrunedScreenshotFiles(screenshots, screenshotsToKeep);

  tabScreenshotStorage.set('tabScreenshots', JSON.stringify(screenshotsToKeep));
};

const deletePrunedScreenshotFiles = async (allScreenshots: ScreenshotType[], screenshotsToKeep: ScreenshotType[]): Promise<void> => {
  try {
    const filesToDelete = allScreenshots.filter(screenshot => !screenshotsToKeep.includes(screenshot));
    const deletePromises = filesToDelete.map(screenshot => {
      const filePath = `${RNFS.DocumentDirectoryPath}/${screenshot.uri}`;
      return RNFS.unlink(filePath).catch(e => {
        logger.error(new RainbowError('Error deleting screenshot file'), {
          message: e.message,
          filePath,
          screenshot: JSON.stringify(screenshot, null, 2),
        });
      });
    });
    await Promise.all(deletePromises);
  } catch (e: any) {
    logger.error(new RainbowError('Screenshot file pruning operation failed to complete'), {
      message: e.message,
    });
  }
};
