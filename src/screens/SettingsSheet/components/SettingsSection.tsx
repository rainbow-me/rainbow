import * as lang from '@/languages';
import React, { useCallback, useMemo } from 'react';
import { Linking, Share } from 'react-native';
import { ContextMenuButton, MenuActionConfig } from 'react-native-ios-context-menu';
import { AppVersionStamp } from '@/components/AppVersionStamp';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import AppIconIcon from '@/assets/settingsAppIcon.png';
import AppIconIconDark from '@/assets/settingsAppIconDark.png';
import WalletsAndBackupIcon from '@/assets/WalletsAndBackup.png';
import CurrencyIcon from '@/assets/settingsCurrency.png';
import CurrencyIconDark from '@/assets/settingsCurrencyDark.png';
import DarkModeIcon from '@/assets/settingsDarkMode.png';
import DarkModeIconDark from '@/assets/settingsDarkModeDark.png';
import LanguageIcon from '@/assets/settingsLanguage.png';
import LanguageIconDark from '@/assets/settingsLanguageDark.png';
import NotificationsIcon from '@/assets/settingsNotifications.png';
import NotificationsIconDark from '@/assets/settingsNotificationsDark.png';
import PrivacyIcon from '@/assets/settingsPrivacy.png';
import PrivacyIconDark from '@/assets/settingsPrivacyDark.png';
import BackupWarningIcon from '@/assets/BackupWarning.png';
import CloudBackupWarningIcon from '@/assets/CloudBackupWarning.png';
import useExperimentalFlag, { LANGUAGE_SETTINGS, NOTIFICATIONS } from '@/config/experimentalHooks';
import { useAccountSettings, useSendFeedback, useWallets } from '@/hooks';
import { Themes, useTheme } from '@/theme';
import { showActionSheetWithOptions } from '@/utils';
import { handleReviewPromptAction } from '@/utils/reviewAlert';
import { ReviewPromptAction } from '@/storage/schema';
import { SettingsExternalURLs } from '../constants';
import { capitalizeFirstLetter, checkWalletsForBackupStatus } from '../utils';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { Box } from '@/design-system';

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

const SettingsSection = ({
  onCloseModal,
  onPressAppIcon,
  onPressBackup,
  onPressCurrency,
  onPressDev,
  onPressLanguage,
  onPressPrivacy,
  onPressNotifications,
}: SettingsSectionProps) => {
  const { wallets, isReadOnlyWallet } = useWallets();
  const { language, nativeCurrency } = useAccountSettings();
  const isLanguageSelectionEnabled = useExperimentalFlag(LANGUAGE_SETTINGS);
  const isNotificationsEnabled = useExperimentalFlag(NOTIFICATIONS);

  const { isDarkMode, setTheme, colorScheme } = useTheme();

  const onSendFeedback = useSendFeedback();
  const { backupProvider } = useMemo(() => checkWalletsForBackupStatus(wallets), [wallets]);

  const onPressReview = useCallback(async () => {
    if (ios) {
      onCloseModal();
    }
    handleReviewPromptAction(ReviewPromptAction.UserPrompt);
  }, [onCloseModal]);

  const onPressShare = useCallback(() => {
    Share.share({
      message: `${lang.t('settings.hey_friend_message')} ${SettingsExternalURLs.rainbowHomepage}`,
    });
  }, []);

  const onPressTwitter = useCallback(async () => {
    Linking.canOpenURL(SettingsExternalURLs.twitterDeepLink).then(supported =>
      supported ? Linking.openURL(SettingsExternalURLs.twitterDeepLink) : Linking.openURL(SettingsExternalURLs.twitterWebUrl)
    );
  }, []);

  const onPressLearn = useCallback(() => Linking.openURL(SettingsExternalURLs.rainbowLearn), []);

  const { allBackedUp, canBeBackedUp } = useMemo(() => checkWalletsForBackupStatus(wallets), [wallets]);

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
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    ({ nativeEvent: { actionKey } }) => {
      setTheme(actionKey);
    },
    [setTheme]
  );

  const getWalletsAndBackupAlertIcon = useCallback(() => {
    if (allBackedUp) {
      return undefined;
    }

    if (backupProvider === walletBackupTypes.cloud) {
      return CloudBackupWarningIcon;
    }

    return BackupWarningIcon;
  }, [allBackedUp, backupProvider]);

  return (
    <MenuContainer testID="settings-menu-container" Footer={<AppVersionStamp />}>
      <Menu>
        {canBeBackedUp && (
          <MenuItem
            hasRightArrow
            leftComponent={<MenuItem.ImageIcon source={WalletsAndBackupIcon} />}
            onPress={onPressBackup}
            rightComponent={
              <Box paddingBottom="2px" paddingRight="8px">
                <MenuItem.ImageIcon size={44} source={getWalletsAndBackupAlertIcon()} />
              </Box>
            }
            size={60}
            testID="backup-section"
            titleComponent={<MenuItem.Title text={lang.t(lang.l.settings.backup)} />}
          />
        )}
        {isNotificationsEnabled && (
          <MenuItem
            hasRightArrow
            leftComponent={<MenuItem.ImageIcon source={isDarkMode ? NotificationsIconDark : NotificationsIcon} />}
            onPress={onPressNotifications}
            size={60}
            titleComponent={<MenuItem.Title text={lang.t(lang.l.settings.notifications)} />}
          />
        )}
        <MenuItem
          hasRightArrow
          leftComponent={<MenuItem.ImageIcon source={isDarkMode ? CurrencyIconDark : CurrencyIcon} />}
          onPress={onPressCurrency}
          rightComponent={<MenuItem.Selection>{nativeCurrency || ''}</MenuItem.Selection>}
          size={60}
          testID="currency-section"
          titleComponent={<MenuItem.Title text={lang.t(lang.l.settings.currency.title)} />}
        />
        {/* {(testnetsEnabled || IS_DEV) && (
          <MenuItem
            hasRightArrow
            leftComponent={
              <MenuItem.ImageIcon
                source={isDarkMode ? NetworkIconDark : NetworkIcon}
              />
            }
            onPress={onPressNetwork}
            rightComponent={
              <MenuItem.Selection>
                {getNetworkObj(network).name}
              </MenuItem.Selection>
            }
            size={60}
            testID="network-section"
            titleComponent={
              <MenuItem.Title text={lang.t('settings.network')} />
            }
          />
        )} */}
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
            leftComponent={<MenuItem.ImageIcon source={isDarkMode ? DarkModeIconDark : DarkModeIcon} />}
            rightComponent={<MenuItem.Selection>{colorScheme ? capitalizeFirstLetter(colorScheme) : ''}</MenuItem.Selection>}
            size={60}
            testID={`theme-section-${isDarkMode ? 'dark' : 'light'}`}
            titleComponent={<MenuItem.Title text={lang.t(lang.l.settings.theme)} />}
          />
        </ContextMenuButton>

        {!isReadOnlyWallet && (
          <MenuItem
            hasRightArrow
            leftComponent={<MenuItem.ImageIcon source={isDarkMode ? PrivacyIconDark : PrivacyIcon} />}
            onPress={onPressPrivacy}
            size={60}
            testID="privacy"
            titleComponent={<MenuItem.Title text={lang.t(lang.l.settings.privacy)} />}
          />
        )}
        {isLanguageSelectionEnabled && (
          <MenuItem
            hasRightArrow
            leftComponent={<MenuItem.ImageIcon source={isDarkMode ? LanguageIconDark : LanguageIcon} />}
            onPress={onPressLanguage}
            rightComponent={<MenuItem.Selection>{(lang.supportedLanguages as any)[language].label || ''}</MenuItem.Selection>}
            size={60}
            titleComponent={<MenuItem.Title text={lang.t(lang.l.settings.language)} />}
          />
        )}
        <MenuItem
          hasRightArrow
          leftComponent={<MenuItem.ImageIcon source={isDarkMode ? AppIconIconDark : AppIconIcon} />}
          onPress={onPressAppIcon}
          size={60}
          testID="app-icon-section"
          titleComponent={<MenuItem.Title text={lang.t(lang.l.settings.app_icon)} />}
        />
      </Menu>
      <Menu>
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="🌈" isEmoji />}
          onPress={onPressShare}
          size={52}
          testID="share-section"
          titleComponent={<MenuItem.Title text={lang.t(lang.l.settings.share_rainbow)} />}
        />
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="🧠" isEmoji />}
          onPress={onPressLearn}
          size={52}
          testID="learn-section"
          titleComponent={<MenuItem.Title text={lang.t(lang.l.settings.learn)} />}
        />
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="🐦" isEmoji />}
          onPress={onPressTwitter}
          size={52}
          testID="twitter-section"
          titleComponent={<MenuItem.Title text={lang.t(lang.l.settings.follow_us_on_twitter)} />}
        />
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="💬" isEmoji />}
          onPress={onSendFeedback}
          size={52}
          testID="feedback-section"
          titleComponent={
            <MenuItem.Title text={ios ? lang.t(lang.l.settings.feedback_and_support) : lang.t(lang.l.settings.feedback_and_support)} />
          }
        />
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon="❤️" isEmoji />}
          onPress={onPressReview}
          size={52}
          testID="review-section"
          titleComponent={<MenuItem.Title text={lang.t(lang.l.settings.review)} />}
        />
        <MenuItem
          leftComponent={<MenuItem.TextIcon icon={ios ? '🚧' : '🐞'} isEmoji />}
          onPress={onPressDev}
          size={52}
          testID="developer-section"
          titleComponent={<MenuItem.Title text={lang.t(lang.l.settings.developer)} />}
        />
      </Menu>
    </MenuContainer>
  );
};

export default SettingsSection;
