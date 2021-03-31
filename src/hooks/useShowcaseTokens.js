import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PreferenceActionType, setPreference } from '../model/preferences';
import { loadWallet } from '../model/wallet';
import { setOpenFamilyTabs } from '../redux/openStateSettings';
import {
  addShowcaseToken as rawAddShowcaseToken,
  removeShowcaseToken as rawRemoveShowcaseToken,
} from '../redux/showcaseTokens';
import { useAccountSettings } from '.';
import {
  getWebShowcaseEnabled,
  saveWebShowcaseEnabled,
} from '@rainbow-me/handlers/localstorage/accountLocal';

export default function useShowcaseTokens() {
  const dispatch = useDispatch();
  const [isWebShowcaseEnabled, setIsWebShowcaseEnabled] = useState(false);
  const showcaseTokens = useSelector(
    state => state.showcaseTokens.showcaseTokens
  );

  const { accountAddress, network } = useAccountSettings();

  useEffect(() => {
    const init = async () => {
      const pref = await getWebShowcaseEnabled(accountAddress, network);
      setIsWebShowcaseEnabled(!!pref);
    };
    init();
  }, [accountAddress, network]);

  const addShowcaseToken = useCallback(
    async asset => {
      dispatch(rawAddShowcaseToken(asset));
      dispatch(setOpenFamilyTabs({ index: 'Showcase', state: true }));
      if (isWebShowcaseEnabled) {
        const wallet = await loadWallet();
        setPreference(PreferenceActionType.add, 'showcase', [asset], wallet);
      }
    },
    [dispatch, isWebShowcaseEnabled]
  );

  const removeShowcaseToken = useCallback(
    async asset => {
      dispatch(rawRemoveShowcaseToken(asset));
      if (isWebShowcaseEnabled) {
        const wallet = await loadWallet();
        setPreference(PreferenceActionType.remove, 'showcase', [asset], wallet);
      }
    },
    [dispatch, isWebShowcaseEnabled]
  );

  const enableWebShowcase = useCallback(async () => {
    const wallet = await loadWallet();
    await setPreference(
      PreferenceActionType.init,
      'showcase',
      showcaseTokens,
      wallet
    );
    await saveWebShowcaseEnabled(true, accountAddress, network);
    setIsWebShowcaseEnabled(true);
  }, [accountAddress, network, showcaseTokens]);

  const disableWebShowcase = useCallback(async () => {
    const wallet = await loadWallet();
    await setPreference(PreferenceActionType.wipe, 'showcase', null, wallet);
    await saveWebShowcaseEnabled(false, accountAddress, network);
    setIsWebShowcaseEnabled(false);
  }, [accountAddress, network]);

  return {
    addShowcaseToken,
    disableWebShowcase,
    enableWebShowcase,
    removeShowcaseToken,
    showcaseTokens,
    webShowcaseEnabled: isWebShowcaseEnabled,
  };
}
