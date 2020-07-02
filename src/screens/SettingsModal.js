import { useNavigation, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import React, { useCallback, useEffect } from 'react';
import { Alert, Animated, View } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { Restart } from 'react-native-restart';
import styled from 'styled-components/native';
import { Modal } from '../components/modal';
import ModalHeaderButton from '../components/modal/ModalHeaderButton';
import {
  CurrencySection,
  LanguageSection,
  NetworkSection,
  SettingsSection,
} from '../components/settings-menu';
import AlreadyBackedUpView from '../components/settings-menu/BackupSection/AlreadyBackedUpView';
import NeedsBackupView from '../components/settings-menu/BackupSection/NeedsBackupView';
import ShowSecretView from '../components/settings-menu/BackupSection/ShowSecretView';
import WalletSelectionView from '../components/settings-menu/BackupSection/WalletSelectionView';
import DevSection from '../components/settings-menu/DevSection';
import WalletTypes from '../helpers/walletTypes';
import { useWallets } from '../hooks';
import { wipeKeychain } from '../model/keychain';
import { colors } from '@rainbow-me/styles';

function cardStyleInterpolator({
  current,
  next,
  inverted,
  layouts: { screen },
}) {
  const translateFocused = Animated.multiply(
    current.progress.interpolate({
      extrapolate: 'clamp',
      inputRange: [0, 1],
      outputRange: [screen.width, 0],
    }),
    inverted
  );
  const translateUnfocused = next
    ? Animated.multiply(
        next.progress.interpolate({
          extrapolate: 'clamp',
          inputRange: [0, 1],
          outputRange: [0, -screen.width],
        }),
        inverted
      )
    : 0;

  return {
    cardStyle: {
      transform: [
        {
          translateX: Animated.add(translateFocused, translateUnfocused),
        },
      ],
    },
  };
}

const statusBarHeight = getStatusBarHeight(true);

const SettingsPages = {
  backup: {
    component: View,
    key: 'BackupSection',
    title: 'Backup',
  },
  currency: {
    component: CurrencySection,
    key: 'CurrencySection',
    title: 'Currency',
  },
  default: {
    component: null,
    key: 'SettingsSection',
    title: 'Settings',
  },
  dev: {
    component: __DEV__ ? DevSection : null,
    key: 'DevSection',
    title: 'Dev',
  },
  language: {
    component: LanguageSection,
    key: 'LanguageSection',
    title: 'Language',
  },
  network: {
    component: NetworkSection,
    key: 'NetworkSection',
    title: 'Network',
  },
};

const Container = styled.View`
  overflow: hidden;
  flex: 1;
  top: -40;
`;

const Stack = createStackNavigator();

const onPressHiddenFeature = () => {
  Alert.alert(
    '🚨🚨🚨 WARNING  🚨🚨🚨',
    `This feature is intended to be used only for developers! \n\n
    You are about to reset all the wallet information from the keychain. \n
    Do you really want to proceed?  If you're not sure, press NO`,
    [
      {
        onPress: () => () => null,
        style: 'cancel',
        text: 'NO',
      },
      {
        onPress: async () => {
          await wipeKeychain();
          Restart();
        },
        text: 'Yes',
      },
    ],
    { cancelable: false }
  );
};

const SettingsModal = () => {
  const { goBack, navigate } = useNavigation();
  const { wallets, selectedWallet } = useWallets();
  const { params } = useRoute();

  const getRealRoute = useCallback(
    key => {
      let route = key;
      if (key === SettingsPages.backup.key) {
        const wallet_id = params?.wallet_id;
        const activeWallet =
          (wallet_id && wallets[wallet_id]) || selectedWallet;
        if (
          !wallet_id &&
          Object.keys(wallets).filter(
            key => wallets[key].type !== WalletTypes.readOnly
          ).length > 1
        ) {
          route = 'WalletSelectionView';
        } else if (activeWallet.backedUp || activeWallet.imported) {
          route = 'AlreadyBackedUpView';
        } else {
          route = 'NeedsBackupView';
        }
      }
      return route;
    },
    [params?.wallet_id, selectedWallet, wallets]
  );

  const onPressSection = useCallback(
    section => () => {
      const route = getRealRoute(section.key);
      navigate(route);
    },
    [getRealRoute, navigate]
  );

  const renderHeaderRight = useCallback(
    () => <ModalHeaderButton label="Done" onPress={goBack} side="right" />,
    [goBack]
  );

  useEffect(() => {
    if (params?.initialRoute) {
      const route = getRealRoute(params?.initialRoute);
      navigate(route);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal marginBottom={statusBarHeight} minHeight={580} onCloseModal={goBack}>
      <Container>
        <Stack.Navigator
          screenOptions={{
            cardStyle: { backgroundColor: colors.white },
            gestureEnabled: false,
            headerRight: renderHeaderRight,
          }}
        >
          <Stack.Screen name="SettingsSection" options={{ title: 'Settings' }}>
            {() => (
              <SettingsSection
                onCloseModal={goBack}
                onPressBackup={onPressSection(SettingsPages.backup)}
                onPressCurrency={onPressSection(SettingsPages.currency)}
                onPressHiddenFeature={onPressHiddenFeature}
                onPressLanguage={onPressSection(SettingsPages.language)}
                onPressNetwork={onPressSection(SettingsPages.network)}
                onPressDev={onPressSection(SettingsPages.dev)}
              />
            )}
          </Stack.Screen>
          {Object.values(SettingsPages).map(
            ({ component, title, key }) =>
              component && (
                <Stack.Screen
                  name={key}
                  component={component}
                  options={{
                    cardStyleInterpolator,
                    title,
                  }}
                />
              )
          )}

          <Stack.Screen
            name="WalletSelectionView"
            component={WalletSelectionView}
            options={{
              cardStyleInterpolator,
              title: 'Backup',
            }}
          />
          <Stack.Screen
            name="AlreadyBackedUpView"
            component={AlreadyBackedUpView}
            options={({ route }) => ({
              title: route.params.title,
              ...cardStyleInterpolator,
            })}
          />
          <Stack.Screen
            name="NeedsBackupView"
            component={NeedsBackupView}
            options={({ route }) => ({
              title: route.params.title,
              ...cardStyleInterpolator,
            })}
          />
          <Stack.Screen
            name="ShowSecretView"
            component={ShowSecretView}
            options={({ route }) => ({
              title: route.params.title,
              ...cardStyleInterpolator,
            })}
          />
        </Stack.Navigator>
      </Container>
    </Modal>
  );
};

export default SettingsModal;
