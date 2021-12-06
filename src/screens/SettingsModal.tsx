import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Animated, InteractionManager, View } from 'react-native';
import styled from 'styled-components';
import { Modal } from '../components/modal';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/modal/ModalHeaderButton' was... Remove this comment to see the full error message
import ModalHeaderButton from '../components/modal/ModalHeaderButton';
import {
  CurrencySection,
  LanguageSection,
  NetworkSection,
  PrivacySection,
  SettingsSection,
} from '../components/settings-menu';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/settings-menu/BackupSection/... Remove this comment to see the full error message
import SettingsBackupView from '../components/settings-menu/BackupSection/SettingsBackupView';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/settings-menu/BackupSection/... Remove this comment to see the full error message
import ShowSecretView from '../components/settings-menu/BackupSection/ShowSecretView';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/settings-menu/BackupSection/... Remove this comment to see the full error message
import WalletSelectionView from '../components/settings-menu/BackupSection/WalletSelectionView';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/settings-menu/DevSection' wa... Remove this comment to see the full error message
import DevSection from '../components/settings-menu/DevSection';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../context/ThemeContext' was resolved to '... Remove this comment to see the full error message
import { useTheme } from '../context/ThemeContext';
import WalletTypes from '../helpers/walletTypes';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../navigation/config' was resolved to '/Us... Remove this comment to see the full error message
import { settingsOptions } from '../navigation/config';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions, useWallets } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';

function cardStyleInterpolator({
  current,
  next,
  inverted,
  layouts: { screen },
}: any) {
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'IS_DEV'.
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

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'walletId' does not exist on type 'object... Remove this comment to see the full error message
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
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'imported' does not exist on type '{}'.
            paramsToPass.imported = true;
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
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
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      ios ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ModalHeaderButton label="Done" onPress={goBack} side="right" />
      ) : null,
    [goBack]
  );

  useEffect(() => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'initialRoute' does not exist on type 'ob... Remove this comment to see the full error message
    if (params?.initialRoute) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'initialRoute' does not exist on type 'ob... Remove this comment to see the full error message
      const { route, params: routeParams } = getRealRoute(params?.initialRoute);
      InteractionManager.runAfterInteractions(() => {
        navigate(route, routeParams);
      });
    }
  }, [getRealRoute, navigate, params]);

  const memoSettingsOptions = useMemo(() => settingsOptions(colors), [colors]);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Modal
      minHeight={height - 100}
      onCloseModal={goBack}
      radius={18}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      showDoneButton={ios}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      skipStatusBar={android}
      testID="settings-modal"
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Container>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Stack.Navigator
          screenOptions={{
            ...memoSettingsOptions,
            headerRight: renderHeaderRight,
          }}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Stack.Screen
            name="SettingsSection"
            options={{
              title: 'Settings',
            }}
          >
            {() => (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Stack.Screen
                  component={component}
                  key={key}
                  name={key}
                  options={{
                    cardStyleInterpolator,
                    title,
                  }}
                  // @ts-expect-error ts-migrate(2322) FIXME: Type '{ component: any; key: string; name: string;... Remove this comment to see the full error message
                  title={title}
                />
              )
          )}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Stack.Screen
            component={WalletSelectionView}
            name="WalletSelectionView"
            options={{
              cardStyle: { backgroundColor: colors.white, marginTop: 6 },
              cardStyleInterpolator,
              title: 'Backup',
            }}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Stack.Screen
            component={SettingsBackupView}
            name="SettingsBackupView"
            options={({ route }) => ({
              cardStyleInterpolator,
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type 'object'.
              title: route.params?.title || 'Backup',
            })}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Stack.Screen
            component={ShowSecretView}
            name="ShowSecretView"
            options={({ route }) => ({
              cardStyleInterpolator,
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type 'object'.
              title: route.params?.title || 'Backup',
            })}
          />
        </Stack.Navigator>
      </Container>
    </Modal>
  );
}
