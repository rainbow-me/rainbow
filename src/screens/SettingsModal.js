import { useNavigation, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import React, { useCallback, useState } from 'react';
import { Alert, Animated, View } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { Restart } from 'react-native-restart';
import styled from 'styled-components/native';
import { Modal, ModalHeader } from '../components/modal';
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
import { colors } from '../styles';

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
  const navigation = useNavigation();
  const { wallets, selectedWallet } = useWallets();
  const { params } = useRoute();

  const [currentSettingsPage, setCurrentSettingsPage] = useState(
    SettingsPages.default
  );

  const { title } = currentSettingsPage;
  const isDefaultPage = title === SettingsPages.default.title;

  const onCloseModal = useCallback(() => navigation.goBack(), [navigation]);

  const onPressBack = useCallback(() => {
    setCurrentSettingsPage(SettingsPages.default);
    navigation.navigate('SettingsSection');
  }, [navigation]);

  const onPressSection = useCallback(
    section => () => {
      let route = section.key;

      if (section === SettingsPages.backup) {
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
      setCurrentSettingsPage(section);
      navigation.navigate(route);
    },
    [navigation, params?.wallet_id, selectedWallet, wallets]
  );

  return (
    <Modal
      marginBottom={statusBarHeight}
      minHeight={580}
      onCloseModal={onCloseModal}
    >
      <Container>
        <ModalHeader
          onPressBack={onPressBack}
          onPressClose={onCloseModal}
          showBackButton={!isDefaultPage}
          title={title}
        />
        <Stack.Navigator
          headerMode="none"
          screenOptions={{
            cardStyle: { backgroundColor: colors.white },
            gestureEnabled: false,
          }}
        >
          <Stack.Screen name="SettingsSection">
            {() => (
              <SettingsSection
                onCloseModal={onCloseModal}
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
                  title={title}
                  component={component}
                  options={{
                    cardStyleInterpolator,
                  }}
                />
              )
          )}

          <Stack.Screen
            name="WalletSelectionView"
            title="Backup"
            component={WalletSelectionView}
            options={{
              cardStyleInterpolator,
            }}
          />
          <Stack.Screen
            name="AlreadyBackedUpView"
            title="Backup"
            component={AlreadyBackedUpView}
            options={({ route }) => ({
              title: route.params.title,
              ...cardStyleInterpolator,
            })}
          />
          <Stack.Screen
            name="NeedsBackupView"
            title="Backup"
            component={NeedsBackupView}
            options={({ route }) => ({
              title: route.params.title,
              ...cardStyleInterpolator,
            })}
          />
          <Stack.Screen
            name="ShowSecretView"
            title="Backup"
            component={ShowSecretView}
            options={({ route }) => ({
              title: route.params.title,
              ...cardStyleInterpolator,
            })}
          />
          {
            // TODO - Add all the backup related screens here
            // and update navigation calls
          }
        </Stack.Navigator>
      </Container>
    </Modal>
  );
};

export default SettingsModal;
