import { RainbowError, logger } from '@/logger';
import { ScreenshotType, TabData, TabId } from './types';
import { MMKV } from 'react-native-mmkv';
import RNFS from 'react-native-fs';

export const tabScreenshotStorage = new MMKV();

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

export const pruneScreenshots = async (tabStateMap: Map<TabId, TabData>): Promise<void> => {
  const persistedData = tabScreenshotStorage.getString('tabScreenshots');
  if (!persistedData) return;

  const screenshots: ScreenshotType[] = JSON.parse(persistedData) || [];
  const screenshotsGroupedByTabId: Record<string, ScreenshotType[]> = screenshots.reduce(
    (acc: Record<string, ScreenshotType[]>, screenshot: ScreenshotType) => {
      if (tabStateMap.get(screenshot.id as TabId)) {
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
    .filter((screenshot: ScreenshotType) => tabStateMap.get(screenshot.id as TabId)?.url === screenshot.url);

  console.log('screenshots to prune', screenshots);
  console.log('screenshots to keep', screenshotsToKeep);
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

export const saveScreenshot = async (tempUri: string, tabId: string, timestamp: number, url: string): Promise<ScreenshotType | null> => {
  const fileName = `screenshot-${timestamp}.jpg`;
  try {
    await RNFS.copyFile(tempUri, `${RNFS.DocumentDirectoryPath}/${fileName}`);
    // Once the file is copied, build the screenshot object
    const newScreenshot: ScreenshotType = {
      id: tabId,
      timestamp,
      uri: fileName,
      url,
    };
    // Retrieve existing screenshots and merge in the new one
    const existingScreenshots = getStoredScreenshots();
    const updatedScreenshots = [...existingScreenshots, newScreenshot];
    // Update MMKV store with the new screenshot
    tabScreenshotStorage.set('tabScreenshots', JSON.stringify(updatedScreenshots));
    // Determine current RNFS document directory
    const screenshotWithRNFSPath: ScreenshotType = {
      ...newScreenshot,
      uri: `${RNFS.DocumentDirectoryPath}/${newScreenshot.uri}`,
    };
    // Set screenshot for display
    return screenshotWithRNFSPath;
  } catch (e: any) {
    logger.error(new RainbowError('Error saving tab screenshot to file system'), {
      message: e.message,
      screenshotData: {
        tempUri,
        tabId,
        url,
      },
    });
  }
  return null;
};
