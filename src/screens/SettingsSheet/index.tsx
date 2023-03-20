import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import ModalHeaderButton from '../../components/modal/ModalHeaderButton';
import { useTheme } from '@/theme';
import { Box } from '@/design-system';
import { useNavigation } from '@/navigation';
import { SettingsPages } from './SettingsPages';
import { settingsCardStyleInterpolator } from './settingsCardStyleInterpolator';
import SettingsBackupView from './components/SettingsBackupView';
import ShowSecretView from './components/ShowSecretView';
import { CUSTOM_MARGIN_TOP_ANDROID } from './constants';
import SettingsSection from './components/SettingsSection';
import WalletNotificationsSettings from './components/WalletNotificationsSettings';
import { settingsOptions } from '@/navigation/config';

const Stack = createStackNavigator();

export function SettingsSheet() {
  const { goBack, navigate } = useNavigation();
  const { params } = useRoute<any>();
  const { colors } = useTheme();

  const sectionOnPressFactory = (section: any) => () => {
    navigate(section.key, params);
  };

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
      InteractionManager.runAfterInteractions(() => {
        navigate(params?.initialRoute);
      });
    }
  }, [navigate, params]);

  const memoSettingsOptions = useMemo(() => settingsOptions(colors), [colors]);
  return (
    <Box
      background="cardBackdrop (Deprecated)"
      flexGrow={1}
      testID="settings-sheet"
      {...(android && {
        borderTopRadius: 30,
        marginTop: { custom: CUSTOM_MARGIN_TOP_ANDROID },
      })}
    >
      <Stack.Navigator
        // @ts-ignore
        screenOptions={{
          ...memoSettingsOptions,
          headerRight: renderHeaderRight,
          headerStyle: memoSettingsOptions.headerStyle,
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
              onPressNotifications={sectionOnPressFactory(
                SettingsPages.notifications
              )}
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
          component={SettingsBackupView}
          name="SettingsBackupView"
          options={({ route }: any) => ({
            cardStyleInterpolator: settingsCardStyleInterpolator,
            title: route.params?.title || lang.t('settings.backup'),
            headerStyle: {
              ...memoSettingsOptions.headerStyle,
              // only do this if sheet needs a header subtitle AND is not scrollable
              // if it's scrollable we need a better fix
              ...(ios && { backgroundColor: 'transparent' }),
            },
          })}
        />
        <Stack.Screen
          component={ShowSecretView}
          name="ShowSecretView"
          options={({ route }: any) => ({
            cardStyleInterpolator: settingsCardStyleInterpolator,
            title: route.params?.title || lang.t('settings.backup'),
          })}
        />
      </Stack.Navigator>
    </Box>
  );
}
