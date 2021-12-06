import AsyncStorage from '@react-native-community/async-storage';
import React, { useCallback, useContext } from 'react';
import { Alert, ScrollView } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { HARDHAT_URL_ANDROID, HARDHAT_URL_IOS } from 'react-native-dotenv';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import Restart from 'react-native-restart';
import { useDispatch } from 'react-redux';
import { ListFooter, ListItem } from '../list';
import { RadioListItem } from '../radio-list';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/cloudBack... Remove this comment to see the full error message
import { deleteAllBackups } from '@rainbow-me/handlers/cloudBackup';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { web3SetHttpProvider } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/RainbowCon... Remove this comment to see the full error message
import { RainbowContext } from '@rainbow-me/helpers/RainbowContext';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useWallets } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/model/keychain' or... Remove this comment to see the full error message
import { wipeKeychain } from '@rainbow-me/model/keychain';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation/Navigat... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation/Navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/explorer' or... Remove this comment to see the full error message
import { explorerInit } from '@rainbow-me/redux/explorer';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/imageMetadat... Remove this comment to see the full error message
import { clearImageMetadataCache } from '@rainbow-me/redux/imageMetadata';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import store from '@rainbow-me/redux/store';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/wallets' or ... Remove this comment to see the full error message
import { walletsUpdate } from '@rainbow-me/redux/wallets';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

const DevSection = () => {
  const { navigate } = useNavigation();
  const { config, setConfig } = useContext(RainbowContext);
  const { wallets } = useWallets();
  const dispatch = useDispatch();

  const onNetworkChange = useCallback(
    value => {
      setConfig({ ...config, [value]: !config[value] });
    },
    [config, setConfig]
  );

  const connectToHardhat = useCallback(async () => {
    try {
      const ready = await web3SetHttpProvider(
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        (ios && HARDHAT_URL_IOS) ||
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          (android && HARDHAT_URL_ANDROID) ||
          'http://127.0.0.1:8545'
      );
      logger.log('connected to hardhat', ready);
    } catch (e) {
      await web3SetHttpProvider(networkTypes.mainnet);
      logger.log('error connecting to hardhat');
    }
    navigate(Routes.PROFILE_SCREEN);
    dispatch(explorerInit());
  }, [dispatch, navigate]);

  const checkAlert = useCallback(async () => {
    try {
      const request = await fetch(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest'
      );
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      if (android && request.status === 500) throw new Error('failed');
      await request.json();
      Alert.alert('Status', 'NOT APPLIED');
    } catch (e) {
      Alert.alert('Status', 'APPLIED');
    }
  }, []);

  const removeBackups = async () => {
    const newWallets = { ...wallets };
    Object.keys(newWallets).forEach(key => {
      delete newWallets[key].backedUp;
      delete newWallets[key].backupDate;
      delete newWallets[key].backupFile;
      delete newWallets[key].backupType;
    });

    await store.dispatch(walletsUpdate(newWallets));

    // Delete all backups (debugging)
    await deleteAllBackups();

    Alert.alert('Backups deleted succesfully');
    Restart();
  };

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  const [errorObj, setErrorObj] = useState(null);

  const throwRenderError = () => {
    setErrorObj({ error: 'this throws render error' });
  };

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ScrollView testID="developer-settings-modal">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ListItem label="💥 Clear async storage" onPress={AsyncStorage.clear} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ListItem
        label="📷️ Clear Image Metadata Cache"
        onPress={clearImageMetadataCache}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ListItem
        label="💣 Reset Keychain"
        onPress={wipeKeychain}
        testID="reset-keychain-section"
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ListItem label="🔄 Restart app" onPress={() => Restart.Restart()} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ListItem
        label="💥 Crash app (render error)"
        onPress={throwRenderError}
        testID="crash-app-section"
      />
      {errorObj}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ListItem label="🗑️ Remove all backups" onPress={removeBackups} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ListItem
        label="🤷 Restore default experimental config"
        onPress={() => AsyncStorage.removeItem('experimentalConfig')}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ListItem
        label="👷 Connect to hardhat"
        onPress={connectToHardhat}
        testID="hardhat-section"
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ListItem label="‍🏖️ Alert" onPress={checkAlert} testID="alert-section" />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ListFooter />
      {Object.keys(config)
        .sort()
        .map(key => (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <RadioListItem
            key={key}
            label={key}
            onPress={() => onNetworkChange(key)}
            selected={!!config[key]}
          />
        ))}
    </ScrollView>
  );
};

export default DevSection;
