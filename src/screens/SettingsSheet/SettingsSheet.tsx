import { createStackNavigator } from '@react-navigation/stack';
import i18n from '@/languages';
import React, { useCallback, useMemo } from 'react';
import ModalHeaderButton from '../../components/modal/ModalHeaderButton';
import { useTheme } from '@/theme';
import { BackgroundProvider } from '@/design-system';
import { useNavigation } from '@/navigation';
import { SettingsPages } from './SettingsPages';
import { settingsCardStyleInterpolator } from './settingsCardStyleInterpolator';
import WiewWalletBackup from './components/Backups/ViewWalletBackup';
import ShowSecretView from './components/Backups/ShowSecretView';
import SecretWarning from './components/Backups/SecretWarning';
import SettingsSection from './components/SettingsSection';
import WalletNotificationsSettings from './components/WalletNotificationsSettings';
import { settingsOptions } from '@/navigation/config';
import ViewCloudBackups from './components/Backups/ViewCloudBackups';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import Routes from '@/navigation/routesNames';
import { useAccountSettings } from '@/hooks';

const Stack = createStackNavigator();

export function SettingsSheet() {
  const { goBack, navigate } = useNavigation();
  const { colors } = useTheme();
  const { language } = useAccountSettings();

  const sectionOnPressFactory = (section: (typeof SettingsPages)[keyof typeof SettingsPages]['key']) => () => {
    navigate(section);
  };

  const renderHeaderRight = useCallback(() => <ModalHeaderButton label={i18n.settings.done()} onPress={goBack} side="right" />, [goBack]);

  const memoSettingsOptions = useMemo(() => settingsOptions(colors), [colors]);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet testID="settings-sheet" backgroundColor={backgroundColor as string} scrollEnabled={false} useAdditionalTopPadding>
          <Stack.Navigator
            screenOptions={{
              ...memoSettingsOptions,
              headerRight: renderHeaderRight,
            }}
          >
            <Stack.Screen
              name={Routes.SETTINGS_SECTION}
              options={{
                cardStyleInterpolator: settingsCardStyleInterpolator,
                title: i18n.settings.label(),
              }}
            >
              {() => (
                <SettingsSection
                  key={language}
                  onCloseModal={goBack}
                  onPressAppIcon={sectionOnPressFactory(SettingsPages.appIcon.key)}
                  onPressBackup={sectionOnPressFactory(SettingsPages.backup.key)}
                  onPressCurrency={sectionOnPressFactory(SettingsPages.currency.key)}
                  onPressDev={sectionOnPressFactory(SettingsPages.dev.key)}
                  onPressLanguage={sectionOnPressFactory(SettingsPages.language.key)}
                  onPressNetwork={sectionOnPressFactory(SettingsPages.network.key)}
                  onPressNotifications={sectionOnPressFactory(SettingsPages.notifications.key)}
                  onPressPrivacy={sectionOnPressFactory(SettingsPages.privacy.key)}
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
                      cardStyleInterpolator: settingsCardStyleInterpolator,
                      title: getTitle(),
                    }}
                    // @ts-ignore
                    title={getTitle()}
                  />
                )
            )}
            <Stack.Screen
              component={WalletNotificationsSettings}
              name={Routes.WALLET_NOTIFICATIONS_SETTINGS}
              options={({ route }: any) => ({
                cardStyleInterpolator: settingsCardStyleInterpolator,
                title: route.params?.title,
              })}
            />
            <Stack.Screen
              component={WiewWalletBackup}
              name={Routes.VIEW_WALLET_BACKUP}
              options={({ route }: any) => ({
                cardStyleInterpolator: settingsCardStyleInterpolator,
                title: route.params?.title,
              })}
            />
            <Stack.Screen
              component={ViewCloudBackups}
              name={Routes.VIEW_CLOUD_BACKUPS}
              options={({ route }: any) => ({
                cardStyleInterpolator: settingsCardStyleInterpolator,
                title: route.params?.title,
              })}
            />
            <Stack.Screen
              component={SecretWarning}
              name={Routes.SECRET_WARNING}
              options={({ route }: any) => ({
                cardStyleInterpolator: settingsCardStyleInterpolator,
                title: route.params?.title,
              })}
            />
            <Stack.Screen
              component={ShowSecretView}
              name={Routes.SHOW_SECRET}
              options={({ route }: any) => ({
                cardStyleInterpolator: settingsCardStyleInterpolator,
                title: route.params?.title,
              })}
            />
          </Stack.Navigator>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
