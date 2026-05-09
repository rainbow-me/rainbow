import { deleteAsync, documentDirectory, writeAsStringAsync } from 'expo-file-system';
import RNShare from 'react-native-share';

import { getAllActiveSessions } from '@/features/wallet-connect/services/sessions';
import { logger, RainbowError } from '@/logger';
import store from '@/redux/store';
import { APP_STATE_DUMP_FILE_NAME } from '@/screens/Diagnostics/constants';

// function partially developed by ChatGPT that helps remove and trace cyclic references in javascript objects
function cyclicReplacer() {
  const seenObjects = new Map<object, string[]>(); // Tracks objects and their paths

  function replacer(key: string | undefined, value: any, path: string[] = []): any {
    if (typeof value === 'object' && value !== null) {
      // Determine the new path
      const newPath = key !== undefined ? path.concat(key) : path;

      if (seenObjects.has(value)) {
        // Construct a string representation of the path to the cyclic reference
        const keys = seenObjects.get(value)?.filter(key => !!key);
        let path = keys?.shift();
        keys?.forEach(key => {
          if (key) {
            if (!isNaN(Number(key))) {
              path += `[${key}]`;
            } else {
              path += `.${key}`;
            }
          }
        });
        return `Cyclic reference to ${path}`;
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
  const state = {
    reduxState,
    walletConnectV2: { sessions: walletConnectV2Sessions },
  };
  const stringifiedState = JSON.stringify(state, cyclicReplacer());

  // `documentDirectory` is `null` only on web (this code is native-only); the
  // value is a `file://` URI ending in `/`.
  const documentsFileUri = `${documentDirectory!}${APP_STATE_DUMP_FILE_NAME}`;
  try {
    // first remove the old file in case the immediate removal failed; `idempotent`
    // makes this a no-op when the file is already gone
    await deleteAsync(documentsFileUri, { idempotent: true });
    await writeAsStringAsync(documentsFileUri, stringifiedState);
    // The share sheet (Save to Files / Drive / etc.) is the cross-platform
    // way to hand the dump off the device.
    await RNShare.open({
      url: documentsFileUri,
    });
    // clean up the file since we don't need it anymore
    await deleteAsync(documentsFileUri, { idempotent: true });
  } catch (error) {
    logger.error(new RainbowError('[createAndShareStateDumpFile]: Saving app state dump data failed'));
  }
}
