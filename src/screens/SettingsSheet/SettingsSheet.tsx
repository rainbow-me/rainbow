import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import { InteractionManager } from 'react-native';
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
import { settingsOptions, sharedCoolModalTopOffset } from '@/navigation/config';
import ViewCloudBackups from './components/Backups/ViewCloudBackups';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { useDimensions } from '@/hooks';
import { SETTINGS_BACKUP_ROUTES } from './components/Backups/routes';
import { IS_ANDROID } from '@/env';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloudBackupProvider } from '@/components/backup/CloudBackupProvider';

const Stack = createStackNavigator();

export function SettingsSheet() {
  const { height: deviceHeight } = useDimensions();
  const { goBack, navigate } = useNavigation();
  const { top } = useSafeAreaInsets();
  const { params } = useRoute<any>();
  const { colors } = useTheme();

  const sectionOnPressFactory = (section: any) => () => {
    navigate(section.key, params);
  };

  const renderHeaderRight = useCallback(
    () => <ModalHeaderButton label={lang.t('settings.done')} onPress={goBack} side="right" />,
    [goBack]
  );

  useEffect(() => {
    if (params?.initialRoute) {
      InteractionManager.runAfterInteractions(() => {
        navigate(params?.initialRoute);
      });
    }
  }, [navigate, params]);

  const memoSettingsOptions = useMemo(() => settingsOptions(colors), [colors]);

  return (
    <CloudBackupProvider>
      <BackgroundProvider color="surfaceSecondary">
        {({ backgroundColor }) => (
          <SimpleSheet
            testID="settings-sheet"
            backgroundColor={backgroundColor as string}
            customHeight={IS_ANDROID ? deviceHeight - top : deviceHeight - sharedCoolModalTopOffset}
            scrollEnabled={false}
          >
            <Stack.Navigator
              screenOptions={{
                ...memoSettingsOptions,
                headerRight: renderHeaderRight,
              }}
            >
              <Stack.Screen
                name="SettingsSection"
                options={{
                  cardStyleInterpolator: settingsCardStyleInterpolator,
                  title: lang.t('settings.label'),
                }}
              >
                {() => (
                  <SettingsSection
                    onCloseModal={goBack}
                    onPressAppIcon={sectionOnPressFactory(SettingsPages.appIcon)}
                    onPressBackup={sectionOnPressFactory(SettingsPages.backup)}
                    onPressCurrency={sectionOnPressFactory(SettingsPages.currency)}
                    onPressDev={sectionOnPressFactory(SettingsPages.dev)}
                    onPressLanguage={sectionOnPressFactory(SettingsPages.language)}
                    onPressNetwork={sectionOnPressFactory(SettingsPages.network)}
                    onPressNotifications={sectionOnPressFactory(SettingsPages.notifications)}
                    onPressPrivacy={sectionOnPressFactory(SettingsPages.privacy)}
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
                name="WalletNotificationsSettings"
                options={({ route }: any) => ({
                  cardStyleInterpolator: settingsCardStyleInterpolator,
                  title: route.params?.title,
                })}
              />
              <Stack.Screen
                component={WiewWalletBackup}
                name={SETTINGS_BACKUP_ROUTES.VIEW_WALLET_BACKUP}
                options={({ route }: any) => ({
                  cardStyleInterpolator: settingsCardStyleInterpolator,
                  title: route.params?.title,
                })}
              />
              <Stack.Screen
                component={ViewCloudBackups}
                name={SETTINGS_BACKUP_ROUTES.VIEW_CLOUD_BACKUPS}
                options={({ route }: any) => ({
                  cardStyleInterpolator: settingsCardStyleInterpolator,
                  title: route.params?.title,
                })}
              />
              <Stack.Screen
                component={SecretWarning}
                name={SETTINGS_BACKUP_ROUTES.SECRET_WARNING}
                options={({ route }: any) => ({
                  cardStyleInterpolator: settingsCardStyleInterpolator,
                  title: route.params?.title,
                })}
              />
              <Stack.Screen
                component={ShowSecretView}
                name={SETTINGS_BACKUP_ROUTES.SHOW_SECRET}
                options={({ route }: any) => ({
                  cardStyleInterpolator: settingsCardStyleInterpolator,
                  title: route.params?.title,
                })}
              />
            </Stack.Navigator>
          </SimpleSheet>
        )}
      </BackgroundProvider>
    </CloudBackupProvider>
  );
}
