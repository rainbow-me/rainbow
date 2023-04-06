import store from '@/redux/store';
import { getCircularReferenceReplacer } from '@/screens/WalletDiagnostics/helpers/getCircularReferenceReplacer';
import RNFS from 'react-native-fs';
import { APP_STATE_DUMP_FILE_NAME } from '@/screens/WalletDiagnostics/constants';
import RNShare from 'react-native-share';
import { IS_ANDROID } from '@/env';
import { logger, RainbowError } from '@/logger';

export async function createAndShareStateDumpFile() {
  const appState = store.getState();
  const stringifiedState = JSON.stringify(
    appState,
    getCircularReferenceReplacer()
  );

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
