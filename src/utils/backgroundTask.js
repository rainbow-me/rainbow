import { Platform, NativeModules } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
let NotificationManager =
  Platform.OS === 'ios' ? NativeModules.NotificationManager : null;

const execute = async callback => {
  if (Platform.OS === 'ios') {
    try {
      console.log('[BG EXEC]: starting background execution');
      // Tell iOS we're running a rap (for tracking purposes)
      NotificationManager &&
        NotificationManager.postNotification('rapInProgress');
      BackgroundTimer.start();
      await callback();
    } catch (e) {
      console.log('[BG] HandleSubmit blew up');
    } finally {
      BackgroundTimer.stop();
      console.log('[BG EXEC]: finished background execution');
    }
  } else {
    let timeoutId;
    try {
      console.log('[BG EXEC]: starting background execution');
      timeoutId = BackgroundTimer.setTimeout(async () => {
        await callback();
        BackgroundTimer.clearTimeout(timeoutId);
        console.log('[BG EXEC]: finished background execution');
      }, 1);
    } catch (e) {
      console.log('[BG] HandleSubmit blew up');
      timeoutId && BackgroundTimer.clearTimeout(timeoutId);
      console.log('[BG EXEC]: finished background execution');
    }
  }
  // Tell iOS we finished running a rap (for tracking purposes)
  NotificationManager && NotificationManager.postNotification('rapCompleted');
};

export default {
  execute,
};
