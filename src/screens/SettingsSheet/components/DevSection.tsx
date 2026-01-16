import { ImgixImage } from '@/components/images';
import { defaultConfig, getExperimentalFlag, LOG_PUSH } from '@/config';
import { IS_DEV } from '@/env';
import { deleteAllBackups } from '@/handlers/cloudBackup';
import { RainbowContext } from '@/helpers/RainbowContext';
import { WrappedAlert as Alert } from '@/helpers/alert';
import isTestFlight from '@/helpers/isTestFlight';
import { getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded } from '@/helpers/signingWallet';
import { logger, RainbowError } from '@/logger';
import { serialize } from '@/logger/logDump';
import { wipeKeychain } from '@/model/keychain';
import { clearAllStorages } from '@/model/mmkv';
import { Navigation, useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { clearImageMetadataCache } from '@/redux/imageMetadata';
import { SettingsLoadingIndicator } from '@/screens/SettingsSheet/components/SettingsLoadingIndicator';
import { clearWalletState, updateWallets, useWallets, useWalletsStore } from '@/state/wallets/walletsStore';
import { isAuthenticated } from '@/utils/authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import * as i18n from '@/languages';
import React, { useCallback, useContext, useState } from 'react';
// @ts-expect-error - react-native-restart is not typed
import Restart from 'react-native-restart';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import type { Address } from 'viem';

import { addDefaultNotificationGroupSettings } from '@/notifications/settings/initialization';
import { unsubscribeAllNotifications } from '@/notifications/settings/settings';
import { getFCMToken } from '@/notifications/tokens';
import { analyzeReactQueryStore, clearReactQueryCache } from '@/react-query/reactQueryUtils';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { nonceActions, getNextNonce } from '@/state/nonces';
import { pendingTransactionsActions } from '@/state/pendingTransactions';
import FastImage from 'react-native-fast-image';
import { analyzeUserAssets } from '@/state/debug/analyzeUserAssets';
import { getAllInternetCredentials, resetInternetCredentials } from 'react-native-keychain';
import { ChainId } from '@/state/backendNetworks/types';
import { executeDelegation, executeRevokeDelegation, getDelegations } from '@rainbow-me/delegation';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { Wallet } from '@ethersproject/wallet';

const DevSection = () => {
  const { navigate } = useNavigation();
  const { config, setConfig } = useContext(RainbowContext) as any;
  const wallets = useWallets();
  const setConnectedToAnvil = useConnectedToAnvilStore.getState().setConnectedToAnvil;
  const accountAddress = useWalletsStore(state => state.accountAddress);

  const [loadingStates, setLoadingStates] = useState({
    clearLocalStorage: false,
    clearAsyncStorage: false,
    clearMmkvStorage: false,
  });

  const onExperimentalKeyChange = useCallback(
    (value: any) => {
      setConfig({ ...config, [value]: !config[value] });
      if ((defaultConfig as any)[value].needsRestart) {
        Navigation.handleAction(Routes.WALLET_SCREEN, {});
        setTimeout(Restart.Restart, 1000);
      }
    },
    [config, setConfig]
  );

  const connectToAnvil = useCallback(async () => {
    try {
      const connectToAnvil = useConnectedToAnvilStore.getState().connectedToAnvil;
      setConnectedToAnvil(!connectToAnvil);
      logger.debug(`[DevSection] connected to anvil`);
    } catch (e) {
      setConnectedToAnvil(false);
      logger.error(new RainbowError(`[DevSection] error connecting to anvil: ${e}`));
    }
    navigate(Routes.PROFILE_SCREEN);
  }, [navigate, setConnectedToAnvil]);

  const checkAlert = useCallback(async () => {
    try {
      const request = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest');
      if (android && request.status === 500) throw new Error('failed');
      await request.json();
      Alert.alert(i18n.t(i18n.l.developer_settings.status), i18n.t(i18n.l.developer_settings.not_applied));
    } catch (e) {
      Alert.alert(i18n.t(i18n.l.developer_settings.status), i18n.t(i18n.l.developer_settings.applied));
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

    await updateWallets(newWallets);

    // Delete all backups (debugging)
    await deleteAllBackups();

    Alert.alert(i18n.t(i18n.l.developer_settings.backups_deleted_successfully));
    Restart();
  };

  const clearImageCache = async () => {
    try {
      ImgixImage.clearDiskCache();
    } catch (e) {
      logger.error(new RainbowError(`Error clearing ImgixImage disk cache: ${e}`));
    }

    try {
      // @ts-expect-error - clearImageCache doesn't exist on ImgixImage
      ImgixImage.clearImageCache();
    } catch (e) {
      logger.error(new RainbowError(`Error clearing ImgixImage cache: ${e}`));
    }

    try {
      FastImage.clearDiskCache();
    } catch (e) {
      logger.error(new RainbowError(`Error clearing FastImage disk cache: ${e}`));
    }

    try {
      FastImage.clearMemoryCache();
    } catch (e) {
      logger.error(new RainbowError(`Error clearing FastImage memory cache: ${e}`));
    }
  };

  const [errorObj, setErrorObj] = useState(null as any);

  const throwRenderError = () => {
    setErrorObj({ error: 'this throws render error' });
  };

  const clearPendingTransactions = async () => {
    pendingTransactionsActions.clearPendingTransactions();
    nonceActions.clearNonces();
  };

  const delegateOnChain = async (chainId: ChainId) => {
    if (!accountAddress) {
      Alert.alert('Error', 'No account address available');
      return;
    }

    try {
      const provider = getProvider({ chainId });

      const wallet = await loadWallet({
        address: accountAddress,
        provider,
      });

      if (!wallet) {
        throw new Error('Failed to load wallet');
      }

      const feeData = await provider.getFeeData();
      const maxFeePerGas = feeData.maxFeePerGas?.toBigInt();
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas?.toBigInt();

      if (!maxFeePerGas || !maxPriorityFeePerGas) {
        throw new Error('Failed to fetch gas prices from provider');
      }

      const nonce = await getNextNonce({ address: accountAddress, chainId });

      // Use null for gasLimit to let the SDK estimate it automatically
      const tx = await executeDelegation({
        signer: wallet as Wallet,
        address: accountAddress,
        provider,
        chainId,
        calldata: '0x',
        transactionOptions: {
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit: null,
        },
        nonce,
      });

      Alert.alert('Success', `Delegation set up on chain ${chainId}. Tx: ${tx.hash}`);
      logger.info(`[DevSection] Delegation set up on chain ${chainId}`, { hash: tx.hash });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `Failed to delegate: ${errorMessage}`);
      logger.error(new RainbowError(`[DevSection] Failed to delegate on chain ${chainId}: ${errorMessage}`));
    }
  };

  const revokeOnChain = async (chainId: ChainId) => {
    if (!accountAddress) {
      Alert.alert('Error', 'No account address available');
      return;
    }

    try {
      const provider = getProvider({ chainId });

      const wallet = await loadWallet({
        address: accountAddress,
        provider,
      });

      if (!wallet) {
        throw new Error('Failed to load wallet');
      }

      const feeData = await provider.getFeeData();
      const maxFeePerGas = feeData.maxFeePerGas?.toBigInt();
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas?.toBigInt();

      if (!maxFeePerGas || !maxPriorityFeePerGas) {
        throw new Error('Failed to fetch gas prices from provider');
      }

      const nonce = await getNextNonce({ address: accountAddress, chainId });

      // Use null for gasLimit to let the SDK estimate it automatically
      const result = await executeRevokeDelegation({
        signer: wallet as Wallet,
        address: accountAddress,
        provider,
        chainId,
        transactionOptions: {
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit: null,
        },
        nonce,
      });

      Alert.alert('Success', `Delegation revoked on chain ${chainId}. Tx: ${result.hash}`);
      logger.info(`[DevSection] Delegation revoked on chain ${chainId}`, { hash: result.hash });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `Failed to revoke delegation: ${errorMessage}`);
      logger.error(new RainbowError(`[DevSection] Failed to revoke delegation on chain ${chainId}: ${errorMessage}`));
    }
  };

  const triggerKillSwitch = async () => {
    if (!accountAddress) {
      Alert.alert('Error', 'No account address available');
      return;
    }

    try {
      const delegationsToRevoke = await getDelegations({ address: accountAddress });

      if (delegationsToRevoke.length > 0) {
        logger.info('Delegation status required', { delegationsToRevoke });
        Navigation.handleAction(Routes.REVOKE_DELEGATION_PANEL, {
          delegationsToRevoke: delegationsToRevoke.map(delegation => ({
            chainId: delegation.chainId,
            contractAddress: delegation.currentContract as Address,
          })),
        });
      } else {
        Alert.alert(
          'Kill Switch Simulated',
          'No active delegations found. The revocation panel will only show if active delegations are detected.'
        );
        logger.debug('No active delegations found for revoke');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `Failed to simulate kill switch: ${errorMessage}`);
      logger.error(new RainbowError(`[DevSection] Failed to simulate kill switch: ${errorMessage}`));
    }
  };

  const clearLocalStorage = async () => {
    setLoadingStates(prev => ({ ...prev, clearLocalStorage: true }));

    await unsubscribeAllNotifications();
    await AsyncStorage.clear();
    clearAllStorages();
    addDefaultNotificationGroupSettings(true);

    setLoadingStates(prev => ({ ...prev, clearLocalStorage: false }));
  };

  const clearAsyncStorage = async () => {
    setLoadingStates(prev => ({ ...prev, clearAsyncStorage: true }));
    await AsyncStorage.clear();
    setLoadingStates(prev => ({ ...prev, clearAsyncStorage: false }));
  };

  const clearMMKVStorage = async () => {
    setLoadingStates(prev => ({ ...prev, clearMmkvStorage: true }));

    await unsubscribeAllNotifications();
    clearAllStorages();
    addDefaultNotificationGroupSettings(true);

    setLoadingStates(prev => ({ ...prev, clearMmkvStorage: false }));
  };

  const clearWallets = async () => {
    const isAuth = await isAuthenticated();
    if (isAuth) {
      const shouldWipeKeychain = await confirmKeychainAlert();
      if (shouldWipeKeychain) {
        await clearWalletState({ resetKeychain: true });
      }
    }
    // we need to navigate back to the welcome screen
    navigate(Routes.WELCOME_SCREEN);
  };

  const wipeKeychainWithAlert = async () => {
    const isAuth = await isAuthenticated();
    // we should require auth before wiping the keychain
    if (isAuth) {
      const shouldWipeKeychain = await confirmKeychainAlert();
      if (shouldWipeKeychain) {
        await wipeKeychain();
        await clearMMKVStorage();
        await clearWalletState({ resetKeychain: true });

        // we need to navigate back to the welcome screen
        navigate(Routes.WELCOME_SCREEN);
      }
    }
  };

  const onPressNavigationEntryPoint = () =>
    navigate(Routes.PAIR_HARDWARE_WALLET_NAVIGATOR, {
      screen: Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET,
    });

  return (
    <MenuContainer testID="developer-settings-sheet">
      <Menu header={IS_DEV || isTestFlight ? 'Normie Settings' : ''}>
        {/* <MenuItem
          disabled
          leftComponent={<MenuItem.TextIcon icon="🕹️" isEmoji />}
          rightComponent={
            <Switch
              onValueChange={toggleTestnetsEnabled}
              value={testnetsEnabled}
            />
          }
          size={52}
          testID="testnet-switch"
          titleComponent={
            <MenuItem.Title
              text={i18n.t(i18n.l.developer_settings.enable_testnets)}
            />
          }
        />
        {testnetsEnabled && <NetworkSection inDevSection />} */}
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
          onPress={clearLocalStorage}
          size={52}
          titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.clear_local_storage)} />}
          rightComponent={loadingStates.clearLocalStorage && <SettingsLoadingIndicator />}
        />
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
          onPress={clearPendingTransactions}
          size={52}
          testID="clear-pending-transactions-section"
          titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.clear_pending_txs)} />}
        />
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="🚨" isEmoji />}
          onPress={wipeKeychainWithAlert}
          size={52}
          testID="reset-keychain-section"
          titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.keychain.menu_title)} />}
        />
      </Menu>
      {(IS_DEV || isTestFlight) && (
        <>
          <Menu header="Rainbow Developer Settings">
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🔄" isEmoji />}
              onPress={() => Restart.Restart()}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.restart_app)} />}
            />
            {/* TEMP: Removal for public TF */}
            {/* <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💳" isEmoji />}
              onPress={clearWallets}
              size={52}
              testID="reset-keychain-section"
              titleComponent={<MenuItem.Title text="Remove all wallets" />}
            /> */}
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🔦" isEmoji />}
              onPress={() => analyzeReactQueryStore()}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.analyze_react_query)} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🔦" isEmoji />}
              onPress={() => analyzeUserAssets()}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.analyze_user_assets_query)} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🗑️" isEmoji />}
              onPress={() => clearReactQueryCache()}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.clear_react_query_cache)} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
              onPress={clearAsyncStorage}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.clear_async_storage)} />}
              rightComponent={loadingStates.clearAsyncStorage && <SettingsLoadingIndicator />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
              onPress={clearMMKVStorage}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.clear_mmkv_storage)} />}
              rightComponent={loadingStates.clearMmkvStorage && <SettingsLoadingIndicator />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="📷️" isEmoji />}
              onPress={clearImageMetadataCache}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.clear_image_metadata_cache)} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="📷️" isEmoji />}
              onPress={clearImageCache}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.clear_image_cache)} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
              onPress={throwRenderError}
              size={52}
              testID="crash-app-section"
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.crash_app_render_error)} />}
            />
            {errorObj}
            {/* TEMP: Removal for public TF}
            {/* <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🗑️" isEmoji />}
              onPress={removeBackups}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.remove_all_backups)} />}
            /> */}
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🤷" isEmoji />}
              onPress={() => AsyncStorage.removeItem('experimentalConfig')}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.reset_experimental_config)} />}
            />

            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="👷" isEmoji />}
              onPress={connectToAnvil}
              size={52}
              testID="anvil-section"
              titleComponent={
                <MenuItem.Title
                  text={
                    useConnectedToAnvilStore.getState().connectedToAnvil
                      ? i18n.t(i18n.l.developer_settings.disconnect_to_anvil)
                      : i18n.t(i18n.l.developer_settings.connect_to_anvil)
                  }
                />
              }
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🏖️" isEmoji />}
              onPress={checkAlert}
              size={52}
              testID="alert-section"
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.alert)} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🗺️" isEmoji />}
              onPress={onPressNavigationEntryPoint}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.navigation_entry_point)} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🤖" isEmoji />}
              onPress={async () => {
                const publicKey = await getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded();

                if (publicKey) {
                  Clipboard.setString(publicKey);
                }

                Alert.alert(publicKey ? `Copied` : `Couldn't get public key`);
              }}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.copy_signing_wallet_address)} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🌎" isEmoji />}
              onPress={async () => {
                const fcmToken = await getFCMToken();

                if (fcmToken) {
                  Clipboard.setString(fcmToken);
                }

                Alert.alert(fcmToken ? 'Copied' : "Couldn't get FCM token");
              }}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.copy_fcm_token)} />}
            />
            {getExperimentalFlag(LOG_PUSH) && (
              <MenuItem
                leftComponent={<MenuItem.TextIcon icon="📋" isEmoji />}
                onPress={async () => {
                  const logs = serialize();
                  Clipboard.setString(logs);
                  Alert.alert(`Copied`);
                }}
                size={52}
                titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.copy_log_lines)} />}
              />
            )}
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="📲" isEmoji />}
              onPress={async () => {
                // This simulates the state that the app will be after a device transfer on iOS.
                // The keychain is not transferred, but all other app data is.
                const shouldWipeKeychain = await confirmKeychainAlert();
                if (shouldWipeKeychain) {
                  const credentials = await getAllInternetCredentials();

                  if (!credentials) return;

                  await Promise.all(credentials.results.map(c => resetInternetCredentials({ server: c.username })));
                }
              }}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.simulate_device_transfer)} />}
            />
          </Menu>
          <Menu header="Delegation Controls">
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🔗" isEmoji />}
              onPress={() => delegateOnChain(ChainId.mainnet)}
              size={52}
              titleComponent={<MenuItem.Title text="Delegate (Mainnet)" />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
              onPress={() => revokeOnChain(ChainId.mainnet)}
              size={52}
              titleComponent={<MenuItem.Title text="Revoke (Mainnet)" />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🔗" isEmoji />}
              onPress={() => delegateOnChain(ChainId.base)}
              size={52}
              titleComponent={<MenuItem.Title text="Delegate (Base)" />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="💥" isEmoji />}
              onPress={() => revokeOnChain(ChainId.base)}
              size={52}
              titleComponent={<MenuItem.Title text="Revoke (Base)" />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🔫" isEmoji />}
              onPress={triggerKillSwitch}
              size={52}
              titleComponent={<MenuItem.Title text="Trigger Kill Switch" />}
            />
          </Menu>
          <Menu header="Feature Flags">
            {Object.keys(config)
              .sort()
              .filter(key => (defaultConfig as any)[key]?.settings)
              .map(key => (
                <MenuItem
                  key={key}
                  onPress={() => onExperimentalKeyChange(key)}
                  rightComponent={!!config[key] && <MenuItem.StatusIcon status="selected" />}
                  size={52}
                  titleComponent={<MenuItem.Title text={key} />}
                />
              ))}
          </Menu>
        </>
      )}
    </MenuContainer>
  );
};

function confirmKeychainAlert(): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    Alert.alert(i18n.t(i18n.l.developer_settings.keychain.alert_title), i18n.t(i18n.l.developer_settings.keychain.alert_body), [
      {
        onPress: () => {
          resolve(true);
        },
        text: i18n.t(i18n.l.developer_settings.keychain.delete_wallets),
      },
      {
        onPress: () => {
          resolve(false);
        },
        style: 'cancel',
        text: i18n.t(i18n.l.button.cancel),
      },
    ]);
  });
}

export default DevSection;
