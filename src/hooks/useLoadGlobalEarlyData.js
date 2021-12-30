import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { contactsLoadState } from '@rainbow-me/redux/contacts';
import { imageMetadataCacheLoadState } from '@rainbow-me/redux/imageMetadata';
import { keyboardHeightsLoadState } from '@rainbow-me/redux/keyboardHeight';
import { settingsLoadState } from '@rainbow-me/redux/settings';
import { transactionSignaturesLoadState } from '@rainbow-me/redux/transactionSignatures';
import { promiseUtils } from '@rainbow-me/utils';
import logger from 'logger';

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

    promises.push(p1, p2, p3, p4, p5);

    return promiseUtils.PromiseAllWithFails(promises);
  }, [dispatch]);

  return loadGlobalData;
}
