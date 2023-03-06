import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { settingsLoadLanguage, settingsLoadState } from '@/redux/settings';

import { promiseUtils } from '@/utils';
import logger from '@/utils/logger';

export default function useLoadGlobalEarlyData() {
  const dispatch = useDispatch();

  const loadGlobalData = useCallback(async () => {
    logger.sentry('Load wallet global early data');
    const promises = [];

    // native currency, app icon, testnetsEnabled, flashbotsEnabled
    const p1 = dispatch(settingsLoadState());
    // language
    const p2 = dispatch(settingsLoadLanguage());

    promises.push(p1, p2);

    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '((dispatch: Dispatch<any>) => Pr... Remove this comment to see the full error message
    return promiseUtils.PromiseAllWithFails(promises);
  }, [dispatch]);

  return loadGlobalData;
}
