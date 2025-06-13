import { settingsLoadLanguage, settingsLoadState } from '@/redux/settings';
import { promiseUtils } from '@/utils';
import { logger } from '@/logger';
import store from '../../redux/store';

export const loadSettingsData = async () => {
  logger.debug('[useloadSettingsData]: Load wallet global early data');

  return promiseUtils.PromiseAllWithFails([
    // native currency, app icon, testnetsEnabled
    store.dispatch(settingsLoadState()),
    // language
    store.dispatch(settingsLoadLanguage()),
  ]);
};
