import AsyncStorage from '@react-native-async-storage/async-storage';
import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { Linking, NativeModules, Share } from 'react-native';
import {
  ContextMenuButton,
  MenuActionConfig,
} from 'react-native-ios-context-menu';
import { supportedLanguages } from '../../languages';
import AppVersionStamp from '../AppVersionStamp';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import AppIconIcon from '@rainbow-me/assets/settingsAppIcon.png';
import AppIconIconDark from '@rainbow-me/assets/settingsAppIconDark.png';
import BackupIcon from '@rainbow-me/assets/settingsBackup.png';
import BackupIconDark from '@rainbow-me/assets/settingsBackupDark.png';
import CurrencyIcon from '@rainbow-me/assets/settingsCurrency.png';
import CurrencyIconDark from '@rainbow-me/assets/settingsCurrencyDark.png';
import DarkModeIcon from '@rainbow-me/assets/settingsDarkMode.png';
import DarkModeIconDark from '@rainbow-me/assets/settingsDarkModeDark.png';
import LanguageIcon from '@rainbow-me/assets/settingsLanguage.png';
import LanguageIconDark from '@rainbow-me/assets/settingsLanguageDark.png';
import NetworkIcon from '@rainbow-me/assets/settingsNetwork.png';
import NetworkIconDark from '@rainbow-me/assets/settingsNetworkDark.png';
import NotificationsIcon from '@rainbow-me/assets/settingsNotifications.png';
import NotificationsIconDark from '@rainbow-me/assets/settingsNotificationsDark.png';
import PrivacyIcon from '@rainbow-me/assets/settingsPrivacy.png';
import PrivacyIconDark from '@rainbow-me/assets/settingsPrivacyDark.png';
import Routes from '@rainbow-me/routes';
import useExperimentalFlag, {
  LANGUAGE_SETTINGS,
  NOTIFICATIONS,
} from '@rainbow-me/config/experimentalHooks';
import { Box } from '@rainbow-me/design-system';
import {
  isCustomBuild,
  setOriginalDeploymentKey,
} from '@rainbow-me/handlers/fedora';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import {
  useAccountSettings,
  useSendFeedback,
  useWallets,
} from '@rainbow-me/hooks';
import { Themes, useTheme } from '@rainbow-me/theme';
import { showActionSheetWithOptions } from '@rainbow-me/utils';
import {
  AppIconSection,
  BackupSection,
  CurrencySettingsSheet,
  DevNotificationsSection,
  DevSection,
  LanguageSection,
  NetworkSection,
  NotificationsSection,
  PrivacySection,
  WalletNotificationsSettings,
} from '../settings-menu';
import {
  AppleReviewAddress,
  REVIEW_DONE_KEY,
} from '@rainbow-me/utils/reviewAlert';
import { useNavigation } from '@rainbow-me/navigation';

const { RainbowRequestReview, RNReview } = NativeModules;

const SettingsExternalURLs = {
  rainbowHomepage: 'https://rainbow.me',
  rainbowLearn: 'https://learn.rainbow.me',
  review:
    'itms-apps://itunes.apple.com/us/app/appName/id1457119021?mt=8&action=write-review',
  twitterDeepLink: 'twitter://user?screen_name=rainbowdotme',
  twitterWebUrl: 'https://twitter.com/rainbowdotme',
};

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const checkAllWallets = (wallets: any) => {
  if (!wallets)
    return { allBackedUp: false, areBackedUp: false, canBeBackedUp: false };
  let areBackedUp = true;
  let canBeBackedUp = false;
  let allBackedUp = true;
  Object.keys(wallets).forEach(key => {
    if (!wallets[key].backedUp && wallets[key].type !== WalletTypes.readOnly) {
      allBackedUp = false;
    }

    if (
      !wallets[key].backedUp &&
      wallets[key].type !== WalletTypes.readOnly &&
      !wallets[key].imported
    ) {
      areBackedUp = false;
    }
    if (wallets[key].type !== WalletTypes.readOnly) {
      canBeBackedUp = true;
    }
  });
  return { allBackedUp, areBackedUp, canBeBackedUp };
};

interface SettingsSectionProps {
  onCloseModal: () => void;
  onPressAppIcon: () => void;
  onPressBackup: () => void;
  onPressCurrency: () => void;
  onPressDev: () => void;
  onPressLanguage: () => void;
  onPressNetwork: () => void;
  onPressPrivacy: () => void;
  onPressNotifications: () => void;
}

const SettingsSection = () => {
  const isReviewAvailable = false;
  const { wallets, isReadOnlyWallet, selectedWallet } = useWallets();
  const { goBack, navigate } = useNavigation();
  const {
    language,
    nativeCurrency,
    network,
    testnetsEnabled,
  } = useAccountSettings();
  const isLanguageSelectionEnabled = useExperimentalFlag(LANGUAGE_SETTINGS);
  const isNotificationsEnabled = useExperimentalFlag(NOTIFICATIONS);

  const { isDarkMode, setTheme, colorScheme } = useTheme();

  const onSendFeedback = useSendFeedback();

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
      component: CurrencySettingsSheet,
      getTitle: () => lang.t('settings.currency'),
      key: 'CurrencySettingsSheet',
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

  const getRealRoute = useCallback(
    (key: any) => {
      let route = key;
      let paramsToPass: { imported?: boolean; type?: string } = {};
      if (key === SettingsPages.backup.key) {
        const walletId = selectedWallet.id;
        if (
          !walletId &&
          Object.keys(wallets!).filter(
            key => wallets![key].type !== WalletTypes.readOnly
          ).length > 1
        ) {
          route = 'BackupSection';
        } else {
          if (
            wallets &&
            Object.keys(wallets).length === 1 &&
            (selectedWallet.imported || selectedWallet.backedUp)
          ) {
            paramsToPass.imported = true;
            paramsToPass.type = 'AlreadyBackedUpView';
          }
          route = 'SettingsBackupView';
        }
      }
      return { params: paramsToPass, route };
    },
    [
      SettingsPages.backup.key,
      selectedWallet.backedUp,
      selectedWallet.id,
      selectedWallet.imported,
      wallets,
    ]
  );

  const onPressSection = useCallback(
    (section: any) => () => {
      console.log(section);
      console.log('TESTING');
      const { params, route } = getRealRoute(section.key);
      navigate(route, params);
    },
    [getRealRoute, navigate]
  );

  const onPressReview = useCallback(async () => {
    if (ios) {
      goBack();
      RainbowRequestReview.requestReview((handled: boolean) => {
        if (!handled) {
          AsyncStorage.setItem(REVIEW_DONE_KEY, 'true');
          Linking.openURL(AppleReviewAddress);
        }
      });
    } else {
      RNReview.show();
    }
  }, [goBack]);

  const onPressShare = useCallback(() => {
    Share.share({
      message: `${lang.t('settings.hey_friend_message')} ${
        SettingsExternalURLs.rainbowHomepage
      }`,
    });
  }, []);

  const onPressTwitter = useCallback(async () => {
    Linking.canOpenURL(SettingsExternalURLs.twitterDeepLink).then(supported =>
      supported
        ? Linking.openURL(SettingsExternalURLs.twitterDeepLink)
        : Linking.openURL(SettingsExternalURLs.twitterWebUrl)
    );
  }, []);

  const onPressLearn = useCallback(
    () => Linking.openURL(SettingsExternalURLs.rainbowLearn),
    []
  );

  const { allBackedUp, areBackedUp, canBeBackedUp } = useMemo(
    () => checkAllWallets(wallets),
    [wallets]
  );

  const themeMenuConfig = useMemo(() => {
    return {
      menuItems: [
        {
          actionKey: Themes.SYSTEM,
          actionTitle: lang.t('settings.theme_section.system'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'gear',
          },
          menuState: colorScheme === Themes.SYSTEM ? 'on' : 'off',
        },
        {
          actionKey: Themes.LIGHT,
          actionTitle: lang.t('settings.theme_section.light'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'sun.max',
          },
          menuState: colorScheme === Themes.LIGHT ? 'on' : 'off',
        },
        {
          actionKey: Themes.DARK,
          actionTitle: lang.t('settings.theme_section.dark'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'moon',
          },
          menuState: colorScheme === Themes.DARK ? 'on' : 'off',
        },
      ] as MenuActionConfig[],
      menuTitle: '',
    };
  }, [colorScheme]);

  const onPressThemeAndroidActions = useCallback(() => {
    const androidActions = [
      lang.t('settings.theme_section.system'),
      lang.t('settings.theme_section.light'),
      lang.t('settings.theme_section.dark'),
    ] as const;

    showActionSheetWithOptions(
      {
        options: androidActions,
        showSeparators: true,
        title: '',
      },
      (idx: number) => {
        if (idx === 0) {
          setTheme(Themes.SYSTEM);
        } else if (idx === 1) {
          setTheme(Themes.LIGHT);
        } else if (idx === 2) {
          setTheme(Themes.DARK);
        }
      }
    );
  }, [setTheme]);

  const handleSelectTheme = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      setTheme(actionKey);
    },
    [setTheme]
  );

  return (
    <MenuContainer>
      <Menu>
        {canBeBackedUp && (
          <MenuItem
            hasRightArrow
            leftComponent={
              <MenuItem.ImageIcon
                source={isDarkMode ? BackupIconDark : BackupIcon}
              />
            }
            onPress={() => onPressSection(SettingsPages.backup)}
            rightComponent={
              <MenuItem.StatusIcon
                status={
                  allBackedUp
                    ? 'complete'
                    : areBackedUp
                    ? 'incomplete'
                    : 'warning'
                }
              />
            }
            size={60}
            testID="backup-section"
            titleComponent={<MenuItem.Title text={lang.t('settings.backup')} />}
          />
        )}
        {isNotificationsEnabled && (
          <MenuItem
            hasRightArrow
            leftComponent={
              <MenuItem.ImageIcon
                source={isDarkMode ? NotificationsIconDark : NotificationsIcon}
              />
            }
            onPress={() => onPressSection(SettingsPages.notifications)}
            size={60}
            titleComponent={
              <MenuItem.Title text={lang.t('settings.notifications')} />
            }
          />
        )}
        <MenuItem
          hasRightArrow
          leftComponent={
            <MenuItem.ImageIcon
              source={isDarkMode ? CurrencyIconDark : CurrencyIcon}
            />
          }
          onPress={() => navigate(Routes.CURRENCY_SETTINGS_SHEET)}
          rightComponent={
            <MenuItem.Selection>{nativeCurrency || ''}</MenuItem.Selection>
          }
          size={60}
          testID="currency-section"
          titleComponent={<MenuItem.Title text={lang.t('settings.currency')} />}
        />
        {(testnetsEnabled || IS_DEV) && (
          <MenuItem
            hasRightArrow
            leftComponent={
              <MenuItem.ImageIcon
                source={isDarkMode ? NetworkIconDark : NetworkIcon}
              />
            }
            onPress={() => onPressSection(SettingsPages.network)}
            rightComponent={
              <MenuItem.Selection>
                {networkInfo?.[network]?.name}
              </MenuItem.Selection>
            }
            size={60}
            testID="network-section"
            titleComponent={
              <MenuItem.Title text={lang.t('settings.network')} />
            }
          />
        )}
        <ContextMenuButton
          menuConfig={themeMenuConfig}
          {...(android ? { onPress: onPressThemeAndroidActions } : {})}
          isMenuPrimaryAction
          // @ts-ignore
          menuAlignmentOverride="right"
          onPressMenuItem={handleSelectTheme}
          useActionSheetFallback={false}
        >
          <MenuItem
            hasChevron
            leftComponent={
              <MenuItem.ImageIcon
                source={isDarkMode ? DarkModeIconDark : DarkModeIcon}
              />
            }
            rightComponent={
              <MenuItem.Selection>
                {colorScheme ? capitalizeFirstLetter(colorScheme) : ''}
              </MenuItem.Selection>
            }
            size={60}
            testID={`theme-section-${isDarkMode ? 'dark' : 'light'}`}
            titleComponent={<MenuItem.Title text={lang.t('settings.theme')} />}
          />
        </ContextMenuButton>

        {!isReadOnlyWallet && (
          <MenuItem
            hasRightArrow
            leftComponent={
              <MenuItem.ImageIcon
                source={isDarkMode ? PrivacyIconDark : PrivacyIcon}
              />
            }
            onPress={() => onPressSection(SettingsPages.privacy)}
            size={60}
            testID="privacy"
            titleComponent={
              <MenuItem.Title text={lang.t('settings.privacy')} />
            }
          />
        )}
        {isLanguageSelectionEnabled && (
          <MenuItem
            hasRightArrow
            leftComponent={
              <MenuItem.ImageIcon
                source={isDarkMode ? LanguageIconDark : LanguageIcon}
              />
            }
            onPress={() => onPressSection(SettingsPages.language)}
            rightComponent={
              <MenuItem.Selection>
                {(supportedLanguages as any)[language] || ''}
              </MenuItem.Selection>
            }
            size={60}
            titleComponent={
              <MenuItem.Title text={lang.t('settings.language')} />
            }
          />
        )}
        {ios && (
          <MenuItem
            hasRightArrow
            leftComponent={
              <MenuItem.ImageIcon
                source={isDarkMode ? AppIconIconDark : AppIconIcon}
              />
            }
            onPress={() => onPressSection(SettingsPages.appIcon)}
            size={60}
            testID="app-icon-section"
            titleComponent={
              <MenuItem.Title text={lang.t('settings.app_icon')} />
            }
          />
        )}
      </Menu>
      <Menu>
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="🌈" isEmoji />}
          onPress={onPressShare}
          size={52}
          testID="share-section"
          titleComponent={
            <MenuItem.Title text={lang.t('settings.share_rainbow')} />
          }
        />
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="🧠" isEmoji />}
          onPress={onPressLearn}
          size={52}
          testID="learn-section"
          titleComponent={<MenuItem.Title text={lang.t('settings.learn')} />}
        />
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="🐦" isEmoji />}
          onPress={onPressTwitter}
          size={52}
          testID="twitter-section"
          titleComponent={
            <MenuItem.Title text={lang.t('settings.follow_us_on_twitter')} />
          }
        />
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="💬" isEmoji />}
          onPress={onSendFeedback}
          size={52}
          testID="feedback-section"
          titleComponent={
            <MenuItem.Title
              text={lang.t(
                ios
                  ? 'settings.feedback_and_support'
                  : 'settings.feedback_and_reports'
              )}
            />
          }
        />
        {isReviewAvailable && (
          <MenuItem
            leftComponent={<MenuItem.TextIcon icon="❤️" isEmoji />}
            onPress={onPressReview}
            size={52}
            testID="review-section"
            titleComponent={<MenuItem.Title text={lang.t('settings.review')} />}
          />
        )}
        {isCustomBuild.value && (
          <MenuItem
            leftComponent={<MenuItem.TextIcon icon="🤯" isEmoji />}
            onPress={setOriginalDeploymentKey}
            size={52}
            titleComponent={
              <MenuItem.Title text={lang.t('settings.restore')} />
            }
          />
        )}
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon={ios ? '🚧' : '🐞'} isEmoji />}
          onPress={() => onPressSection(SettingsPages.dev)}
          size={52}
          testID="developer-section"
          titleComponent={
            <MenuItem.Title text={lang.t('settings.developer')} />
          }
        />
      </Menu>
      <Box alignItems="center" width="full">
        <AppVersionStamp />
      </Box>
    </MenuContainer>
  );
};

export default SettingsSection;
