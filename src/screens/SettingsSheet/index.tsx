import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import ModalHeaderButton from '../../components/modal/ModalHeaderButton';
import { useTheme } from '@/theme';
import { Box } from '@/design-system';
import { useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import { SettingsPages } from './SettingsPages';
import { settingsCardStyleInterpolator } from './settingsCardStyleInterpolator';
import WalletTypes from '@/helpers/walletTypes';
import SettingsBackupView from './components/SettingsBackupView';
import ShowSecretView from './components/ShowSecretView';
import { CUSTOM_MARGIN_TOP_ANDROID } from './constants';
import SettingsSection from './components/SettingsSection';
import WalletNotificationsSettings from './components/WalletNotificationsSettings';
import { settingsOptions } from '@/navigation/config';
import { IS_ANDROID } from '@/env';

const Stack = createStackNavigator();

export function SettingsSheet() {
  const { goBack, navigate } = useNavigation();
  const { wallets } = useWallets();
  const { params } = useRoute<any>();
  const { colors } = useTheme();

  const getRealRoute = useCallback(
    (key: any) => {
      let route = key;
      const paramsToPass: {
        imported?: boolean;
        type?: string;
        walletId?: string;
      } = {};
      // for android we need to exit early to display google account information
      if (IS_ANDROID) {
        return { params: { ...params, ...paramsToPass }, route };
      }
      const nonReadonlyWallets = Object.keys(wallets!).filter(
        key => wallets![key].type !== WalletTypes.readOnly
      );
      if (key === SettingsPages.backup.key) {
        const walletId = params?.walletId;
        // Check if we have more than 1 NON readonly wallets, then show the list of wallets
        if (!walletId && nonReadonlyWallets.length > 1) {
          route = 'BackupSection';
          // Check if we have one wallet that's not readonly
          // then show the single screen for that wallet.
        } else {
          if (wallets && nonReadonlyWallets.length === 1) {
            // Get the non watched wallet
            const defaultSelectedWalletId = Object.keys(wallets!).find(
              (key: string) => wallets![key].type !== WalletTypes.readOnly
            );
            if (defaultSelectedWalletId) {
              if (wallets[defaultSelectedWalletId].backedUp) {
                paramsToPass.type = 'AlreadyBackedUpView';
              }
              if (wallets[defaultSelectedWalletId].imported) {
                paramsToPass.imported = true;
              }
              paramsToPass.walletId = defaultSelectedWalletId;
            }
          }
          route = 'SettingsBackupView';
        }
      }
      return { params: { ...params, ...paramsToPass }, route };
    },
    [params, wallets]
  );

  const onPressSection = useCallback(
    (section: any) => () => {
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
              onPressAppIcon={onPressSection(SettingsPages.appIcon)}
              onPressBackup={onPressSection(SettingsPages.backup)}
              onPressCurrency={onPressSection(SettingsPages.currency)}
              onPressDev={onPressSection(SettingsPages.dev)}
              onPressLanguage={onPressSection(SettingsPages.language)}
              onPressNetwork={onPressSection(SettingsPages.network)}
              onPressNotifications={onPressSection(SettingsPages.notifications)}
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
