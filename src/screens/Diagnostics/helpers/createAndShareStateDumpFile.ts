import store from '@/redux/store';
import RNFS from 'react-native-fs';
import { APP_STATE_DUMP_FILE_NAME } from '@/screens/Diagnostics/constants';
import RNShare from 'react-native-share';
import { IS_ANDROID } from '@/env';
import { logger, RainbowError } from '@/logger';
import { stringify } from 'flatted';
import { getAllActiveSessions } from '@/walletConnect';

function cyclicReplacer() {
  const seenObjects = new Map<object, string[]>(); // Tracks objects and their paths

  function replacer(
    key: string | undefined,
    value: any,
    path: string[] = []
  ): any {
    if (typeof value === 'object' && value !== null) {
      // Determine the new path
      const newPath = key !== undefined ? path.concat(key) : path;

      if (seenObjects.has(value)) {
        // Construct a string representation of the path to the cyclic reference
        return `Cyclic reference to ${seenObjects
          .get(value)
          ?.filter(key => !!key)
          ?.join('.')}`;
      }

      seenObjects.set(value, newPath);

      // Recursively handle nested objects and arrays
      const valueCopy: { [key: string]: any } = Array.isArray(value) ? [] : {};
      for (const k of Object.keys(value)) {
        valueCopy[k] = replacer(k, value[k], newPath);
      }
      return valueCopy;
    }
    return value;
  }

  return (key: string, value: any): any => replacer(key, value);
}

export async function createAndShareStateDumpFile() {
  const reduxState = store.getState();
  const walletConnectV2Sessions = await getAllActiveSessions();
  const appState = {
    ...reduxState,
    walletConnectV2: { sessions: walletConnectV2Sessions },
  };
  const stringifiedState = JSON.stringify(appState, cyclicReplacer());

  const documentsFilePath = `${RNFS.DocumentDirectoryPath}/${APP_STATE_DUMP_FILE_NAME}`;
  try {
    // first remove the old file in case the immediate removal failed
    const fileExists = await RNFS.exists(documentsFilePath);
    if (fileExists) {
      await RNFS.unlink(documentsFilePath);
    }
    await RNFS.writeFile(documentsFilePath, stringifiedState, 'utf8');
    if (IS_ANDROID) {
      await RNFS.writeFile(
        `${RNFS.DownloadDirectoryPath}/app_state_dump_${Date.now()}.json`,
        stringifiedState,
        'utf8'
      );
    }
    await RNShare.open({
      url: `file://${documentsFilePath}`,
    });
    // clean up the file since we don't need it anymore
    await RNFS.unlink(documentsFilePath);
  } catch (error) {
    logger.error(new RainbowError('Saving app state dump data failed'));
  }
}
