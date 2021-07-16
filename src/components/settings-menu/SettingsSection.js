import AsyncStorage from '@react-native-community/async-storage';
import React, { Fragment, useCallback, useMemo } from 'react';
import { Image, Linking, NativeModules, ScrollView, Share } from 'react-native';
import styled from 'styled-components';
// import { REVIEW_ANDROID } from '../../config/experimental';
// import useExperimentalFlag from '../../config/experimentalHooks';
// import { supportedLanguages } from '../../languages';
import { THEMES, useTheme } from '../../context/ThemeContext';
import AppVersionStamp from '../AppVersionStamp';
import { Icon } from '../icons';
import { Column, ColumnWithDividers } from '../layout';
import {
  ListFooter,
  ListItem,
  ListItemArrowGroup,
  ListItemDivider,
} from '../list';
import { Emoji, Text } from '../text';
import BackupIcon from '@rainbow-me/assets/settingsBackup.png';
import BackupIconDark from '@rainbow-me/assets/settingsBackupDark.png';
import CurrencyIcon from '@rainbow-me/assets/settingsCurrency.png';
import CurrencyIconDark from '@rainbow-me/assets/settingsCurrencyDark.png';
import DarkModeIcon from '@rainbow-me/assets/settingsDarkMode.png';
import DarkModeIconDark from '@rainbow-me/assets/settingsDarkModeDark.png';
import NetworkIcon from '@rainbow-me/assets/settingsNetwork.png';
import NetworkIconDark from '@rainbow-me/assets/settingsNetworkDark.png';
import PrivacyIcon from '@rainbow-me/assets/settingsPrivacy.png';
import PrivacyIconDark from '@rainbow-me/assets/settingsPrivacyDark.png';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import {
  useAccountSettings,
  useDimensions,
  useSendFeedback,
  useWallets,
} from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';
import {
  AppleReviewAddress,
  REVIEW_DONE_KEY,
} from '@rainbow-me/utils/reviewAlert';

const { RainbowRequestReview, RNReview } = NativeModules;

export const SettingsExternalURLs = {
  rainbowHomepage: 'https://rainbow.me',
  review:
    'itms-apps://itunes.apple.com/us/app/appName/id1457119021?mt=8&action=write-review',
  twitterDeepLink: 'twitter://user?screen_name=rainbowdotme',
  twitterWebUrl: 'https://twitter.com/rainbowdotme',
};

const CheckmarkIcon = styled(Icon).attrs({
  name: 'checkmarkCircled',
})`
  box-shadow: 0px 4px 6px
    ${({ theme: { colors, isDarkMode } }) =>
      colors.alpha(isDarkMode ? colors.shadow : colors.blueGreyDark50, 0.4)};
`;

const Container = styled(Column).attrs({})`
  ${position.cover};
  background-color: ${({ backgroundColor }) => backgroundColor};
`;

const scrollContainerStyle = { flex: 1 };
const ScrollContainer = styled(ScrollView).attrs({
  scrollEventThrottle: 32,
})``;

// ⚠️ Beware: magic numbers lol
const SettingIcon = styled(Image)`
  ${position.size(60)};
  margin-left: -16;
  margin-right: -11;
  margin-top: 8;
`;

const VersionStampContainer = styled(Column).attrs({
  align: 'center',
  justify: 'end',
})`
  flex: 1;
  padding-bottom: 19;
`;

const WarningIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.orangeLight,
  name: 'warning',
}))`
  box-shadow: 0px 4px 6px
    ${({ theme: { colors, isDarkMode } }) =>
      isDarkMode ? colors.shadow : colors.alpha(colors.orangeLight, 0.4)};
  margin-top: 1;
`;

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const checkAllWallets = wallets => {
  if (!wallets) return false;
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
    if (!wallets[key].type !== WalletTypes.readOnly) {
      canBeBackedUp = true;
    }
  });
  return { allBackedUp, areBackedUp, canBeBackedUp };
};

export default function SettingsSection({
  onCloseModal,
  onPressBackup,
  onPressCurrency,
  onPressDev,
  onPressIcloudBackup,
  /*onPressLanguage,*/
  onPressNetwork,
  onPressPrivacy,
  onPressShowSecret,
}) {
  const isReviewAvailable = false;
  const { wallets, isReadOnlyWallet } = useWallets();
  const { /*language,*/ nativeCurrency, network } = useAccountSettings();
  const { isTinyPhone } = useDimensions();

  const { colors, isDarkMode, setTheme, colorScheme } = useTheme();

  const onSendFeedback = useSendFeedback();

  const onPressReview = useCallback(async () => {
    if (ios) {
      onCloseModal();
      RainbowRequestReview.requestReview(handled => {
        if (!handled) {
          AsyncStorage.setItem(REVIEW_DONE_KEY, 'true');
          Linking.openURL(AppleReviewAddress);
        }
      });
    } else {
      RNReview.show();
    }
  }, [onCloseModal]);

  const onPressShare = useCallback(() => {
    Share.share({
      message: `👋️ Hey friend! You should download Rainbow, it's my favorite Ethereum wallet 🌈️🌈️🌈️🌈️🌈️🌈️🌈️🌈️🌈️🌈️ ${SettingsExternalURLs.rainbowHomepage}`,
    });
  }, []);

  const onPressTwitter = useCallback(async () => {
    Linking.canOpenURL(SettingsExternalURLs.twitterDeepLink).then(supported =>
      supported
        ? Linking.openURL(SettingsExternalURLs.twitterDeepLink)
        : Linking.openURL(SettingsExternalURLs.twitterWebUrl)
    );
  }, []);

  const { allBackedUp, areBackedUp, canBeBackedUp } = useMemo(
    () => checkAllWallets(wallets),
    [wallets]
  );

  const backupStatusColor = allBackedUp
    ? colors.green
    : colors.alpha(colors.blueGreyDark, 0.5);

  const toggleTheme = useCallback(() => {
    if (colorScheme === THEMES.SYSTEM) {
      setTheme(THEMES.LIGHT);
    } else if (colorScheme === THEMES.LIGHT) {
      setTheme(THEMES.DARK);
    } else {
      setTheme(THEMES.SYSTEM);
    }
  }, [setTheme, colorScheme]);

  return (
    <Container backgroundColor={colors.white}>
      <ScrollContainer
        contentContainerStyle={!isTinyPhone && scrollContainerStyle}
        scrollEnabled={isTinyPhone}
      >
        <ColumnWithDividers dividerRenderer={ListItemDivider} marginTop={7}>
          {canBeBackedUp && (
            <ListItem
              icon={
                <SettingIcon
                  source={isDarkMode ? BackupIconDark : BackupIcon}
                />
              }
              label="Backup"
              onPress={onPressBackup}
              onPressIcloudBackup={onPressIcloudBackup}
              onPressShowSecret={onPressShowSecret}
              testID="backup-section"
            >
              <ListItemArrowGroup>
                {areBackedUp ? (
                  <CheckmarkIcon
                    color={backupStatusColor}
                    isDarkMode={isDarkMode}
                  />
                ) : (
                  <WarningIcon />
                )}
              </ListItemArrowGroup>
            </ListItem>
          )}
          <ListItem
            icon={
              <SettingIcon
                source={isDarkMode ? CurrencyIconDark : CurrencyIcon}
              />
            }
            label="Currency"
            onPress={onPressCurrency}
            testID="currency-section"
          >
            <ListItemArrowGroup>{nativeCurrency || ''}</ListItemArrowGroup>
          </ListItem>
          <ListItem
            icon={
              <SettingIcon
                source={isDarkMode ? NetworkIconDark : NetworkIcon}
              />
            }
            label="Network"
            onPress={onPressNetwork}
            testID="network-section"
          >
            <ListItemArrowGroup>
              {networkInfo?.[network]?.name}
            </ListItemArrowGroup>
          </ListItem>
          <ListItem
            icon={
              <SettingIcon
                source={isDarkMode ? DarkModeIconDark : DarkModeIcon}
              />
            }
            label="Theme"
            onPress={toggleTheme}
            testID={`darkmode-section-${isDarkMode}`}
          >
            <Column align="end" flex="1" justify="end">
              <Text
                color={colors.alpha(colors.blueGreyDark, 0.6)}
                size="large"
                weight="medium"
              >
                {capitalizeFirstLetter(colorScheme)}
              </Text>
            </Column>
          </ListItem>
          {!isReadOnlyWallet && (
            <ListItem
              icon={
                <SettingIcon
                  source={isDarkMode ? PrivacyIconDark : PrivacyIcon}
                />
              }
              label="Privacy"
              onPress={onPressPrivacy}
              testID="privacy"
            >
              <ListItemArrowGroup />
            </ListItem>
          )}
          {/*<ListItem
        {/*  icon={*/}
          {/*    <SettingIcon source={darkMode ? LanguageIconDark : LanguageIcon} />*/}
          {/*  }*/}
          {/*  label="Language"*/}
          {/*  onPress={onPressLanguage}*/}
          {/*>*/}
          {/*  <ListItemArrowGroup>*/}
          {/*    {supportedLanguages[language] || ''}*/}
          {/*  </ListItemArrowGroup>*/}
          {/*</ListItem>*/}
        </ColumnWithDividers>
        <ListFooter />
        <ColumnWithDividers dividerRenderer={ListItemDivider}>
          <ListItem
            icon={<Emoji name="rainbow" />}
            label="Share Rainbow"
            onPress={onPressShare}
            testID="share-section"
            value={SettingsExternalURLs.rainbowHomepage}
          />
          <ListItem
            icon={<Emoji name="bird" />}
            label="Follow Us on Twitter"
            onPress={onPressTwitter}
            testID="twitter-section"
            value={SettingsExternalURLs.twitter}
          />
          <ListItem
            icon={<Emoji name={ios ? 'speech_balloon' : 'lady_beetle'} />}
            label={ios ? 'Feedback and Support' : 'Feedback & Bug Reports'}
            onPress={onSendFeedback}
            testID="feedback-section"
          />
          {isReviewAvailable && (
            <ListItem
              icon={<Emoji name="red_heart" />}
              label="Review Rainbow"
              onPress={onPressReview}
              testID="review-section"
            />
          )}
        </ColumnWithDividers>
        {IS_DEV && (
          <Fragment>
            <ListFooter height={10} />
            <ListItem
              icon={<Emoji name="construction" />}
              label="Developer Settings"
              onPress={onPressDev}
              testID="developer-section"
            />
          </Fragment>
        )}

        <VersionStampContainer>
          <AppVersionStamp />
        </VersionStampContainer>
      </ScrollContainer>
    </Container>
  );
}
