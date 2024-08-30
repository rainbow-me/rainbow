import RNFS from 'react-native-fs';
import { MMKV } from 'react-native-mmkv';
import { RainbowError, logger } from '@/logger';
import { RAINBOW_HOME } from './constants';
import { ScreenshotType, TabData, TabId } from './types';

export const tabScreenshotStorage = new MMKV();

export const getStoredScreenshots = (): ScreenshotType[] => {
  const persistedScreenshots = tabScreenshotStorage.getString('tabScreenshots');
  return persistedScreenshots ? (JSON.parse(persistedScreenshots) as ScreenshotType[]) : [];
};

export const findTabScreenshot = (id: string, url?: string): ScreenshotType | null => {
  if (!url || url === RAINBOW_HOME) return null;

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

export const pruneScreenshots = async (tabsData: Map<TabId, TabData>): Promise<void> => {
  const persistedData = tabScreenshotStorage.getString('tabScreenshots');
  if (!persistedData) return;

  const screenshots: ScreenshotType[] = JSON.parse(persistedData);
  const activeTabIds = new Set(tabsData.keys());

  const screenshotsToKeep: Map<string, ScreenshotType> = new Map();
  const screenshotsToDelete: ScreenshotType[] = [];

  screenshots.forEach(screenshot => {
    const tabData = tabsData.get(screenshot.id);
    if (tabData && tabData.url === screenshot.url) {
      const existing = screenshotsToKeep.get(screenshot.id);
      if (!existing || existing.timestamp < screenshot.timestamp) {
        // Keep the latest screenshot for each still-open tab
        screenshotsToKeep.set(screenshot.id, screenshot);
      }
    } else if (!activeTabIds.has(screenshot.id)) {
      // Delete screenshots for closed tabs
      screenshotsToDelete.push(screenshot);
    }
  });

  await deletePrunedScreenshotFiles(screenshotsToDelete);
  tabScreenshotStorage.set('tabScreenshots', JSON.stringify(Array.from(screenshotsToKeep.values())));
};

const deletePrunedScreenshotFiles = async (screenshotsToDelete: ScreenshotType[]): Promise<void> => {
  try {
    const deletePromises = screenshotsToDelete.map(screenshot => {
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
