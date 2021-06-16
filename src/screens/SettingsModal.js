import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Animated, InteractionManager, View } from 'react-native';
import styled from 'styled-components';
import { Modal } from '../components/modal';
import ModalHeaderButton from '../components/modal/ModalHeaderButton';
import {
  CurrencySection,
  LanguageSection,
  NetworkSection,
  PrivacySection,
  SettingsSection,
} from '../components/settings-menu';
import SettingsBackupView from '../components/settings-menu/BackupSection/SettingsBackupView';
import ShowSecretView from '../components/settings-menu/BackupSection/ShowSecretView';
import WalletSelectionView from '../components/settings-menu/BackupSection/WalletSelectionView';
import DevSection from '../components/settings-menu/DevSection';
import { useTheme } from '../context/ThemeContext';
import WalletTypes from '../helpers/walletTypes';
import { settingsOptions } from '../navigation/config';
import { useDimensions, useWallets } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';

function cardStyleInterpolator({
  current,
  next,
  inverted,
  layouts: { screen },
}) {
  const translateFocused = Animated.multiply(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [screen.width, 0],
    }),
    inverted
  );
  const translateUnfocused = next
    ? Animated.multiply(
        next.progress.interpolate({
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
    component: IS_DEV ? DevSection : null,
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
  privacy: {
    component: PrivacySection,
    key: 'PrivacySection',
    title: 'Privacy',
  },
};

const Container = styled.View`
  flex: 1;
  overflow: hidden;
`;

const Stack = createStackNavigator();

export default function SettingsModal() {
  const { goBack, navigate } = useNavigation();
  const { wallets, selectedWallet } = useWallets();
  const { params } = useRoute();
  const { height } = useDimensions();
  const { colors } = useTheme();

  const getRealRoute = useCallback(
    key => {
      let route = key;
      let paramsToPass = {};
      if (key === SettingsPages.backup.key) {
        const walletId = params?.walletId;
        if (
          !walletId &&
          Object.keys(wallets).filter(
            key => wallets[key].type !== WalletTypes.readOnly
          ).length > 1
        ) {
          route = 'WalletSelectionView';
        } else {
          if (Object.keys(wallets).length === 1 && selectedWallet.imported) {
            paramsToPass.imported = true;
            paramsToPass.type = 'AlreadyBackedUpView';
          }
          route = 'SettingsBackupView';
        }
      }
      return { params: { ...params, ...paramsToPass }, route };
    },
    [params, selectedWallet.imported, wallets]
  );

  const onPressSection = useCallback(
    section => () => {
      const { params, route } = getRealRoute(section.key);
      navigate(route, params);
    },
    [getRealRoute, navigate]
  );

  const renderHeaderRight = useCallback(
    () =>
      ios ? (
        <ModalHeaderButton label="Done" onPress={goBack} side="right" />
      ) : null,
    [goBack]
  );

  useEffect(() => {
    if (params?.initialRoute) {
      const { route, params: routeParams } = getRealRoute(params?.initialRoute);
      InteractionManager.runAfterInteractions(() => {
        navigate(route, routeParams);
      });
    }
  }, [getRealRoute, navigate, params]);

  const memoSettingsOptions = useMemo(() => settingsOptions(colors), [colors]);
  return (
    <Modal
      minHeight={height - 100}
      onCloseModal={goBack}
      radius={18}
      showDoneButton={ios}
      skipStatusBar={android}
      testID="settings-modal"
    >
      <Container>
        <Stack.Navigator
          screenOptions={{
            ...memoSettingsOptions,
            headerRight: renderHeaderRight,
          }}
        >
          <Stack.Screen
            name="SettingsSection"
            options={{
              title: 'Settings',
            }}
          >
            {() => (
              <SettingsSection
                onCloseModal={goBack}
                onPressBackup={onPressSection(SettingsPages.backup)}
                onPressCurrency={onPressSection(SettingsPages.currency)}
                onPressDev={onPressSection(SettingsPages.dev)}
                onPressLanguage={onPressSection(SettingsPages.language)}
                onPressNetwork={onPressSection(SettingsPages.network)}
                onPressPrivacy={onPressSection(SettingsPages.privacy)}
              />
            )}
          </Stack.Screen>
          {Object.values(SettingsPages).map(
            ({ component, title, key }) =>
              component && (
                <Stack.Screen
                  component={component}
                  key={key}
                  name={key}
                  options={{
                    cardStyleInterpolator,
                    title,
                  }}
                  title={title}
                />
              )
          )}

          <Stack.Screen
            component={WalletSelectionView}
            name="WalletSelectionView"
            options={{
              cardStyle: { backgroundColor: colors.white, marginTop: 6 },
              cardStyleInterpolator,
              title: 'Backup',
            }}
          />
          <Stack.Screen
            component={SettingsBackupView}
            name="SettingsBackupView"
            options={({ route }) => ({
              cardStyleInterpolator,
              title: route.params?.title || 'Backup',
            })}
          />
          <Stack.Screen
            component={ShowSecretView}
            name="ShowSecretView"
            options={({ route }) => ({
              cardStyleInterpolator,
              title: route.params?.title || 'Backup',
            })}
          />
        </Stack.Navigator>
      </Container>
    </Modal>
  );
}
