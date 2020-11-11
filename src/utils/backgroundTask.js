import { NativeModules } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import logger from 'logger';

let NotificationManager = ios ? NativeModules.NotificationManager : null;

const execute = async callback => {
  if (ios) {
    try {
      logger.log('[BG EXEC]: starting background execution');
      // Tell iOS we're running a rap (for tracking purposes)
      NotificationManager &&
        NotificationManager.postNotification('rapInProgress');
      BackgroundTimer.start();
      await callback();
    } catch (e) {
      logger.log('[BG] HandleSubmit blew up');
    } finally {
      BackgroundTimer.stop();
      logger.log('[BG EXEC]: finished background execution');
    }
  } else {
    let timeoutId;
    try {
      logger.log('[BG EXEC]: starting background execution');
      timeoutId = BackgroundTimer.setTimeout(async () => {
        await callback();
        BackgroundTimer.clearTimeout(timeoutId);
        logger.log('[BG EXEC]: finished background execution');
      }, 1);
    } catch (e) {
      logger.log('[BG] HandleSubmit blew up');
      timeoutId && BackgroundTimer.clearTimeout(timeoutId);
      logger.log('[BG EXEC]: finished background execution');
    }
  }
  // Tell iOS we finished running a rap (for tracking purposes)
  NotificationManager && NotificationManager.postNotification('rapCompleted');
};

export default {
  execute,
};
