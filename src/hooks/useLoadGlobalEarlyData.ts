import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { contactsLoadState } from '@/redux/contacts';
import { imageMetadataCacheLoadState } from '@/redux/imageMetadata';
import { keyboardHeightsLoadState } from '@/redux/keyboardHeight';
import { settingsLoadLanguage, settingsLoadState } from '@/redux/settings';
import { transactionSignaturesLoadState } from '@/redux/transactionSignatures';
import { promiseUtils } from '@/utils';
import logger from '@/utils/logger';

export default function useLoadGlobalEarlyData() {
  const dispatch = useDispatch();

  const loadGlobalData = useCallback(async () => {
    logger.sentry('Load wallet global early data');
    const promises = [];
    const p1 = dispatch(settingsLoadState());
    const p2 = dispatch(imageMetadataCacheLoadState());
    const p3 = dispatch(keyboardHeightsLoadState());
    const p4 = dispatch(transactionSignaturesLoadState());
    const p5 = dispatch(contactsLoadState());
    const p6 = dispatch(settingsLoadLanguage());

    promises.push(p1, p2, p3, p4, p5, p6);

    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '((dispatch: Dispatch<any>) => Pr... Remove this comment to see the full error message
    return promiseUtils.PromiseAllWithFails(promises);
  }, [dispatch]);

  return loadGlobalData;
}
