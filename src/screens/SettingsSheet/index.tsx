import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import ModalHeaderButton from '../../components/modal/ModalHeaderButton';
import { useTheme } from '@/theme';
import { Box, Inline, Text, BackgroundProvider } from '@/design-system';
import { useNavigation } from '@/navigation';
import { SettingsPages } from './SettingsPages';
import { settingsCardStyleInterpolator } from './settingsCardStyleInterpolator';
import SettingsBackupView from './components/SettingsBackupView';
import ShowSecretView from './components/ShowSecretView';
import { CUSTOM_MARGIN_TOP_ANDROID } from './constants';
import SettingsSection from './components/SettingsSection';
import WalletNotificationsSettings from './components/WalletNotificationsSettings';
import { settingsOptions } from '@/navigation/config';
import { IS_IOS } from '@/env';
import { createBottomSheetNavigator } from '@/navigation/bottom-sheet';
import * as i18n from '@/languages';
import { bottomSheetPreset } from '@/navigation/effects';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { useDimensions } from '@/hooks';
import Routes from '@/navigation/routesNames';

const Stack = createStackNavigator();
const BStack = createBottomSheetNavigator();

export function SettingsSheet() {
  const { goBack, navigate } = useNavigation();
  const { params } = useRoute<any>();
  const { colors } = useTheme();
  const { height: deviceHeight } = useDimensions();

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

  if (IS_IOS) {
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
  } else {
    // Android
    return (
      <BackgroundProvider color="surfaceSecondary">
        {({ backgroundColor }) => (
          <SimpleSheet
            backgroundColor={backgroundColor as string}
            customHeight={deviceHeight}
          >
            <Inline alignHorizontal="center" alignVertical="center">
              <Box paddingTop="19px (Deprecated)" paddingBottom="12px">
                <Text size="22pt" weight="heavy" color="label">
                  {i18n.t(i18n.l.settings.label)}
                </Text>
              </Box>
            </Inline>

            <BStack.Navigator
            // @ts-ignore
            >
              <BStack.Screen
                name="SettingsSection"
                //@ts-ignore
                options={bottomSheetPreset}
              >
                {() => (
                  <SettingsSection
                    onCloseModal={goBack}
                    onPressAppIcon={sectionOnPressFactory(
                      SettingsPages.appIcon
                    )}
                    onPressBackup={sectionOnPressFactory(SettingsPages.backup)}
                    onPressCurrency={sectionOnPressFactory(
                      SettingsPages.currency
                    )}
                    onPressDev={sectionOnPressFactory(SettingsPages.dev)}
                    onPressLanguage={sectionOnPressFactory(
                      SettingsPages.language
                    )}
                    onPressNetwork={sectionOnPressFactory(
                      SettingsPages.network
                    )}
                    onPressNotifications={sectionOnPressFactory(
                      SettingsPages.notifications
                    )}
                    onPressPrivacy={sectionOnPressFactory(
                      SettingsPages.privacy
                    )}
                  />
                )}
              </BStack.Screen>
              {Object.values(SettingsPages).map(
                ({ component, getTitle, key }) =>
                  component && (
                    <BStack.Screen
                      component={component}
                      key={key}
                      name={key}
                      //@ts-ignore
                      options={bottomSheetPreset}
                    />
                  )
              )}
              <BStack.Screen
                component={WalletNotificationsSettings}
                name="WalletNotificationsSettings"
                //@ts-ignore
                options={bottomSheetPreset}
              />
              <BStack.Screen
                component={SettingsBackupView}
                name="SettingsBackupView"
                //@ts-ignore
                options={bottomSheetPreset}
              />
            </BStack.Navigator>
          </SimpleSheet>
        )}
      </BackgroundProvider>
    );
  }
}
