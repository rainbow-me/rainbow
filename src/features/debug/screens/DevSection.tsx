import React, { useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import FastImage from 'react-native-fast-image';
import { getAllInternetCredentials, resetInternetCredentials } from 'react-native-keychain';
// @ts-expect-error - react-native-restart is not typed
import Restart from 'react-native-restart';

import { ImgixImage } from '@/components/images';
import ContextMenuButton, { type MenuConfig } from '@/components/native-context-menu/contextMenu';
import { IS_STORE_INSTALL } from '@/env';
import { useCashDepositSetupStore } from '@/features/cash/stores/cashDepositSetupStore';
import {
  CASH_MOCK_ORDER_OUTCOMES,
  isCashMockOrderOutcome,
  useCashMockOrderOutcomeStore,
  type CashMockOrderOutcome,
} from '@/features/cash/stores/cashMockOrderOutcomeStore';
import { type CashDepositSetupFacts } from '@/features/cash/stores/deriveCashDepositSetupStatus';
import { defaultConfig, defaultConfigValues, type ExperimentalConfigKey } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { RevokeReason } from '@/features/delegation/screens/RevokeDelegationPanel';
import { getDelegationContractAddress, isRainbowDelegated, isThirdPartyDelegated } from '@/features/delegation/utils/status';
import { isAuthenticated } from '@/features/local-auth/isAuthenticated';
import { wipeKeychain } from '@/features/local-auth/legacyKeychain';
import { ChainId } from '@/features/network/types/backendNetworks';
import { useSandboxDiagnosticsStore } from '@/features/sandbox/data/stores/sandboxDiagnosticsStore';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded } from '@/helpers/signingWallet';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { clearAllStorages } from '@/model/mmkv';
import Navigation, { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { addDefaultNotificationGroupSettings } from '@/notifications/settings/initialization';
import { unsubscribeAllNotifications } from '@/notifications/settings/settings';
import { getFCMToken } from '@/notifications/tokens';
import { analyzeReactQueryStore, clearReactQueryCache } from '@/react-query/reactQueryUtils';
import { clearImageMetadataCache } from '@/redux/imageMetadata';
import Menu from '@/screens/SettingsSheet/components/Menu';
import MenuContainer from '@/screens/SettingsSheet/components/MenuContainer';
import MenuItem from '@/screens/SettingsSheet/components/MenuItem';
import { SettingsLoadingIndicator } from '@/screens/SettingsSheet/components/SettingsLoadingIndicator';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { nonceActions } from '@/state/nonces';
import { pendingTransactionsActions } from '@/state/pendingTransactions';
import { clearWalletState, useWalletsStore } from '@/state/wallets/walletsStore';
import { delegation, type DelegationWithChainId } from '@rainbow-me/delegation';

import { analyzeUserAssets } from '../utils/analyzeUserAssets';

// Dev-only select that drives the mock buy-order outcome (success vs PAYMENT_REJECTED failure).
function CashMockOrderOutcomeMenuItem() {
  const outcome = useCashMockOrderOutcomeStore(state => state.outcome);
  const setOutcome = useCashMockOrderOutcomeStore(state => state.setOutcome);

  const outcomeLabel = useCallback((value: CashMockOrderOutcome) => i18n.t(i18n.l.developer_settings.cash_order_outcome[value]), []);

  const menuConfig = useMemo<MenuConfig>(
    () => ({
      menuTitle: i18n.t(i18n.l.developer_settings.cash_order_outcome.title),
      menuItems: CASH_MOCK_ORDER_OUTCOMES.map(value => ({
        actionKey: value,
        actionTitle: outcomeLabel(value),
        menuState: value === outcome ? 'on' : 'off',
      })),
    }),
    [outcome, outcomeLabel]
  );

  const onPressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: string } }) => {
      if (isCashMockOrderOutcome(actionKey)) setOutcome(actionKey);
    },
    [setOutcome]
  );

  return (
    <ContextMenuButton menuConfig={menuConfig} isMenuPrimaryAction onPressMenuItem={onPressMenuItem} useActionSheetFallback={false}>
      <MenuItem
        hasChevron
        rightComponent={<MenuItem.Selection>{outcomeLabel(outcome)}</MenuItem.Selection>}
        size={52}
        testID="cash-mock-order-outcome-select"
        titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.cash_order_outcome.title)} />}
      />
    </ContextMenuButton>
  );
}

export const DevSection = () => {
  const { navigate } = useNavigation();
  const config = useExperimentalConfigStore(state => state.config);
  const setConnectedToAnvil = useConnectedToAnvilStore.getState().setConnectedToAnvil;
  const accountAddress = useWalletsStore(state => state.accountAddress);
  const cashDepositSetupFacts = useCashDepositSetupStore(state => state.facts);
  const setCashDepositSetupFact = useCashDepositSetupStore(state => state.setFact);

  const [loadingStates, setLoadingStates] = useState({
    clearLocalStorage: false,
    clearAsyncStorage: false,
    clearMmkvStorage: false,
  });

  const onExperimentalKeyChange = useCallback((value: ExperimentalConfigKey) => {
    useExperimentalConfigStore.getState().toggleFlag(value);
    if (defaultConfig[value].needsRestart) {
      Navigation.handleAction(Routes.WALLET_SCREEN);
      setTimeout(Restart.Restart, 1000);
    }
  }, []);

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
      if (Platform.OS === 'android' && request.status === 500) throw new Error('failed');
      await request.json();
      Alert.alert(i18n.t(i18n.l.developer_settings.status), i18n.t(i18n.l.developer_settings.not_applied));
    } catch (e) {
      Alert.alert(i18n.t(i18n.l.developer_settings.status), i18n.t(i18n.l.developer_settings.applied));
    }
  }, []);

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

  const wipeAppAndRestart = async () => {
    const isAuth = await isAuthenticated();
    if (isAuth) {
      const shouldWipeKeychain = await confirmKeychainAlert();
      if (shouldWipeKeychain) {
        await unsubscribeAllNotifications();
        await wipeKeychain();
        await AsyncStorage.clear();
        clearAllStorages();
        addDefaultNotificationGroupSettings(true);
        await clearWalletState({ resetKeychain: true });
        Restart.Restart();
      }
    }
  };

  const onPressNavigationEntryPoint = () =>
    navigate(Routes.PAIR_HARDWARE_WALLET_NAVIGATOR, {
      screen: Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET,
    });

  const triggerRevokeSheet = useCallback(
    async (revokeReason: RevokeReason) => {
      if (!accountAddress) return;

      const delegations = await delegation.active({ address: accountAddress });
      const rainbowDelegations = delegations.filter(isRainbowDelegated);
      const thirdPartyDelegations = delegations.filter(isThirdPartyDelegated);

      const mapToRevokes = (delegationList: readonly DelegationWithChainId[]) =>
        delegationList.map(delegation => {
          const contractAddress = getDelegationContractAddress(delegation);
          return contractAddress
            ? {
                chainId: delegation.chainId,
                contractAddress,
              }
            : {
                chainId: delegation.chainId,
              };
        });

      const toRevoke = (() => {
        switch (revokeReason) {
          case RevokeReason.DISABLE_SMART_WALLET:
            return rainbowDelegations.length > 0 ? mapToRevokes(rainbowDelegations) : [{ chainId: ChainId.mainnet }];
          case RevokeReason.DISABLE_SINGLE_NETWORK: {
            const baseDelegation = rainbowDelegations.find(d => d.chainId === ChainId.base);
            return baseDelegation ? mapToRevokes([baseDelegation]) : [{ chainId: ChainId.base }];
          }
          case RevokeReason.DISABLE_THIRD_PARTY:
            return thirdPartyDelegations.length > 0 ? mapToRevokes(thirdPartyDelegations) : [{ chainId: ChainId.mainnet }];
          default:
            return [{ chainId: ChainId.mainnet }];
        }
      })();

      navigate(Routes.REVOKE_DELEGATION_PANEL, {
        address: accountAddress,
        revokeReason,
        delegationsToRevoke: toRevoke,
      });
    },
    [accountAddress, navigate]
  );

  return (
    <MenuContainer testID="developer-settings-sheet">
      <Menu header={!IS_STORE_INSTALL ? i18n.t(i18n.l.developer_settings.headers.normie_settings) : ''}>
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
      {!IS_STORE_INSTALL && (
        <>
          <Menu header={i18n.t(i18n.l.developer_settings.headers.rainbow_developer_settings)}>
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🔄" isEmoji />}
              onPress={() => Restart.Restart()}
              size={52}
              titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.restart_app)} />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🏝️" isEmoji />}
              onPress={() => useSandboxDiagnosticsStore.getState().open()}
              size={52}
              testID="sandbox-diagnostics-section"
              titleComponent={<MenuItem.Title text="Sandbox diagnostics" />}
            />
            <MenuItem
              leftComponent={<MenuItem.TextIcon icon="🧨" isEmoji />}
              onPress={wipeAppAndRestart}
              size={52}
              testID="wipe-app-and-restart-section"
              titleComponent={<MenuItem.Title text="Wipe App + Restart" />}
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
              onPress={() => useExperimentalConfigStore.setState({ config: defaultConfigValues })}
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
          <Menu header={i18n.t(i18n.l.developer_settings.headers.delegation_settings)}>
            {Object.values(RevokeReason).map(reason => {
              const label = {
                [RevokeReason.DISABLE_SMART_WALLET]: i18n.t(i18n.l.developer_settings.delegation_settings.simulate_disable_smart_wallet),
                [RevokeReason.DISABLE_SINGLE_NETWORK]: i18n.t(
                  i18n.l.developer_settings.delegation_settings.simulate_disable_single_network
                ),
                [RevokeReason.DISABLE_THIRD_PARTY]: i18n.t(i18n.l.developer_settings.delegation_settings.simulate_disable_third_party),
                [RevokeReason.ALERT_VULNERABILITY]: i18n.t(i18n.l.developer_settings.delegation_settings.simulate_alert_vulnerability),
                [RevokeReason.ALERT_BUG]: i18n.t(i18n.l.developer_settings.delegation_settings.simulate_alert_bug),
                [RevokeReason.ALERT_UNRECOGNIZED]: i18n.t(i18n.l.developer_settings.delegation_settings.simulate_alert_unrecognized),
                [RevokeReason.ALERT_UNSPECIFIED]: i18n.t(i18n.l.developer_settings.delegation_settings.simulate_alert_unspecified),
              }[reason];
              return (
                <MenuItem
                  key={reason}
                  leftComponent={<MenuItem.TextIcon icon={reason.startsWith('alert_') ? '⚠️' : '🔧'} isEmoji />}
                  onPress={() => triggerRevokeSheet(reason)}
                  size={52}
                  titleComponent={<MenuItem.Title text={label} />}
                />
              );
            })}
          </Menu>
          <Menu header={i18n.t(i18n.l.developer_settings.headers.cash_settings)}>
            {(Object.keys(cashDepositSetupFacts) as (keyof CashDepositSetupFacts)[]).map(key => (
              <MenuItem
                key={key}
                onPress={() => setCashDepositSetupFact(key, !cashDepositSetupFacts[key])}
                rightComponent={cashDepositSetupFacts[key] && <MenuItem.StatusIcon status="selected" />}
                size={52}
                titleComponent={<MenuItem.Title text={i18n.t(i18n.l.developer_settings.cash_deposit_setup_facts[key])} />}
              />
            ))}
            <CashMockOrderOutcomeMenuItem />
          </Menu>
          <Menu header={i18n.t(i18n.l.developer_settings.headers.feature_flags)}>
            {(Object.keys(config) as ExperimentalConfigKey[])
              .sort()
              .filter(key => defaultConfig[key]?.settings)
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
