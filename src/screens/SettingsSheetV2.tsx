import { useRoute } from '@react-navigation/native';
import {
  createStackNavigator,
  StackCardInterpolationProps,
} from '@react-navigation/stack';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Animated, InteractionManager, View } from 'react-native';
import ModalHeaderButton from '../components/modal/ModalHeaderButton';
import {
  CurrencySectionV2,
  DevNotificationsSection,
  DevSectionV2,
  LanguageSectionV2,
  NetworkSectionV2,
  NotificationsSection,
  PrivacySectionV2,
  SettingsSectionV2,
  WalletNotificationsSettings,
} from '../components/settings-menu';
import SettingsBackupView from '../components/settings-menu/BackupSection/SettingsBackupView';
import ShowSecretView from '../components/settings-menu/BackupSection/ShowSecretView';
import WalletSelectionViewV2 from '../components/settings-menu/BackupSection/WalletSelectionViewV2';
import WalletTypes from '../helpers/walletTypes';
import { settingsOptions } from '../navigation/config';
import { useTheme } from '../theme/ThemeContext';
import { AccentColorProvider, Box } from '@rainbow-me/design-system';
import { useWallets } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';

function cardStyleInterpolator({
  current,
  next,
  inverted,
  layouts: { screen },
}: StackCardInterpolationProps) {
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
    getTitle: () => lang.t('settings.backup'),
    key: 'BackupSection',
  },
  currency: {
    component: CurrencySectionV2,
    getTitle: () => lang.t('settings.currency'),
    key: 'CurrencySection',
  },
  default: {
    component: null,
    getTitle: () => lang.t('settings.label'),
    key: 'SettingsSection',
  },
  dev: {
    component: DevSectionV2,
    getTitle: () => lang.t('settings.dev'),
    key: 'DevSection',
  },
  language: {
    component: LanguageSectionV2,
    getTitle: () => lang.t('settings.language'),
    key: 'LanguageSection',
  },
  network: {
    component: NetworkSectionV2,
    getTitle: () => lang.t('settings.network'),
    key: 'NetworkSection',
  },
  notifications: {
    component: NotificationsSection,
    getTitle: () => lang.t('settings.notifications'),
    key: 'NotificationsSection',
  },
  privacy: {
    component: PrivacySectionV2,
    getTitle: () => lang.t('settings.privacy'),
    key: 'PrivacySection',
  },
};

const Stack = createStackNavigator();

export default function SettingsSheet() {
  const { goBack, navigate } = useNavigation();
  const { wallets, selectedWallet } = useWallets();
  const { params } = useRoute<any>();
  const { colors, isDarkMode } = useTheme();

  const getRealRoute = useCallback(
    key => {
      let route = key;
      let paramsToPass: { imported?: boolean; type?: string } = {};
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
        <ModalHeaderButton
          label={lang.t('settings.done')}
          onPress={goBack}
          side="right"
        />
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
    <AccentColorProvider color={colors.settings.background}>
      <Box
        background="accent"
        flexGrow={1}
        testID="settings-sheet"
        {...(android && { borderTopRadius: 30 })}
      >
        <Stack.Navigator
          // @ts-expect-error
          screenOptions={{
            ...memoSettingsOptions,
            headerRight: renderHeaderRight,
          }}
        >
          <Stack.Screen
            name="SettingsSection"
            options={{
              cardStyleInterpolator,
              title: lang.t('settings.label'),
            }}
          >
            {() => (
              /** @ts-expect-error – JS component */
              <SettingsSectionV2
                onCloseModal={goBack}
                onPressBackup={onPressSection(SettingsPages.backup)}
                onPressCurrency={onPressSection(SettingsPages.currency)}
                onPressDev={onPressSection(SettingsPages.dev)}
                onPressLanguage={onPressSection(SettingsPages.language)}
                onPressNetwork={onPressSection(SettingsPages.network)}
                onPressNotifications={onPressSection(
                  SettingsPages.notifications
                )}
                onPressPrivacy={onPressSection(SettingsPages.privacy)}
              />
            )}
          </Stack.Screen>
          {Object.values(SettingsPages).map(
            ({ component, getTitle, key }) =>
              component && (
                <Stack.Screen
                  component={component}
                  key={key}
                  name={key}
                  options={{
                    cardStyleInterpolator,
                    title: getTitle(),
                  }}
                  // @ts-expect-error
                  title={getTitle()}
                />
              )
          )}

          <Stack.Screen
            component={WalletSelectionViewV2}
            name="WalletSelectionView"
            options={{
              cardStyleInterpolator,
              title: lang.t('settings.backup'),
            }}
          />
          <Stack.Screen
            component={DevNotificationsSection}
            name="DevNotificationsSection"
            options={{
              cardStyleInterpolator,
              title: lang.t('developer_settings.notifications_debug'),
            }}
          />
          <Stack.Screen
            component={WalletNotificationsSettings}
            name="WalletNotificationsSettings"
            options={({ route }) => ({
              cardStyleInterpolator,
              // @ts-expect-error
              title: route.params?.title,
            })}
          />
          <Stack.Screen
            component={SettingsBackupView}
            name="SettingsBackupView"
            options={({ route }) => ({
              cardStyleInterpolator,
              // @ts-expect-error
              title: route.params?.title || lang.t('settings.backup'),
            })}
          />
          <Stack.Screen
            component={ShowSecretView}
            name="ShowSecretView"
            options={({ route }) => ({
              cardStyleInterpolator,
              // @ts-expect-error
              title: route.params?.title || lang.t('settings.backup'),
            })}
          />
        </Stack.Navigator>
      </Box>
    </AccentColorProvider>
  );
}
