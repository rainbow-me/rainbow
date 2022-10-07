import { useRoute } from '@react-navigation/native';
import {
  createStackNavigator,
  StackCardInterpolationProps,
} from '@react-navigation/stack';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Animated, InteractionManager } from 'react-native';
import ModalHeaderButton from '../components/modal/ModalHeaderButton';
import {
  AppIconSection,
  CurrencySection,
  DevSection,
  LanguageSection,
  NetworkSection,
  NotificationsSection,
  PrivacySection,
  SettingsSection,
  WalletNotificationsSettings,
} from '../components/settings-menu';
import BackupSection from '../components/settings-menu/BackupSection/BackupSection';
import SettingsBackupView from '../components/settings-menu/BackupSection/SettingsBackupView';
import ShowSecretView from '../components/settings-menu/BackupSection/ShowSecretView';
import WalletTypes from '../helpers/walletTypes';
import { settingsOptions } from '../navigation/config';
import { useTheme } from '../theme/ThemeContext';
import { Box } from '@/design-system';
import { useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';

export const CUSTOM_MARGIN_TOP_ANDROID = 8;

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
  appIcon: {
    component: AppIconSection,
    getTitle: () => lang.t('settings.app_icon'),
    key: 'AppIconSection',
  },
  backup: {
    component: BackupSection,
    getTitle: () => lang.t('settings.backup'),
    key: 'BackupSection',
  },
  currency: {
    component: CurrencySection,
    getTitle: () => lang.t('settings.currency'),
    key: 'CurrencySection',
  },
  default: {
    component: null,
    getTitle: () => lang.t('settings.label'),
    key: 'SettingsSection',
  },
  dev: {
    component: DevSection,
    getTitle: () => lang.t('settings.dev'),
    key: 'DevSection',
  },
  language: {
    component: LanguageSection,
    getTitle: () => lang.t('settings.language'),
    key: 'LanguageSection',
  },
  network: {
    component: NetworkSection,
    getTitle: () => lang.t('settings.network'),
    key: 'NetworkSection',
  },
  notifications: {
    component: NotificationsSection,
    getTitle: () => lang.t('settings.notifications'),
    key: 'NotificationsSection',
  },
  privacy: {
    component: PrivacySection,
    getTitle: () => lang.t('settings.privacy'),
    key: 'PrivacySection',
  },
};

const Stack = createStackNavigator();

export default function SettingsSheet() {
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
            cardStyleInterpolator,
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
                  cardStyleInterpolator,
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
            cardStyleInterpolator,
            title: route.params?.title,
          })}
        />
        <Stack.Screen
          component={SettingsBackupView}
          name="SettingsBackupView"
          options={({ route }: any) => ({
            cardStyleInterpolator,
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
            cardStyleInterpolator,
            title: route.params?.title || lang.t('settings.backup'),
          })}
        />
      </Stack.Navigator>
    </Box>
  );
}
