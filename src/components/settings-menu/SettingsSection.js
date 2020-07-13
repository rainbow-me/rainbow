import { get } from 'lodash';
import React, { useCallback } from 'react';
import {
  InteractionManager,
  Linking,
  NativeModules,
  ScrollView,
} from 'react-native';
import { isEmulatorSync } from 'react-native-device-info';
import FastImage from 'react-native-fast-image';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import * as StoreReview from 'react-native-store-review';
import styled from 'styled-components/primitives';
import BackupIcon from '../../assets/backup-icon.png';
import CurrencyIcon from '../../assets/currency-icon.png';
import LanguageIcon from '../../assets/language-icon.png';
import NetworkIcon from '../../assets/network-icon.png';
// import SecurityIcon from '../../assets/security-icon.png';
import {
  getAppStoreReviewCount,
  saveAppStoreReviewCount,
} from '../../handlers/localstorage/globalSettings';
import networkInfo from '../../helpers/networkInfo';
import { useAccountSettings, useSendFeedback, useWallets } from '../../hooks';
import { supportedLanguages } from '../../languages';
import AppVersionStamp from '../AppVersionStamp';
import { Column, ColumnWithDividers } from '../layout';
import {
  ListFooter,
  ListItem,
  ListItemArrowGroup,
  ListItemDivider,
} from '../list';
import { Emoji } from '../text';
import { position } from '@rainbow-me/styles';

const { RainbowRequestReview } = NativeModules;

const SettingsExternalURLs = {
  review:
    'itms-apps://itunes.apple.com/us/app/appName/id1457119021?mt=8&action=write-review',
  twitterDeepLink: 'twitter://user?screen_name=rainbowdotme',
  twitterWebUrl: 'https://twitter.com/rainbowdotme',
};

// ⚠️ Beware: magic numbers lol
const SettingIcon = styled(FastImage)`
  ${position.size(44)};
  margin-left: -6;
  margin-right: -4;
  margin-top: 8;
`;

let versionPressHandle = null;
let versionNumberOfTaps = 0;

const SettingsSection = ({
  onCloseModal,
  onPressBackup,
  onPressCurrency,
  onPressHiddenFeature,
  onPressLanguage,
  onPressNetwork,
  onPressDev,
}) => {
  const { isReadOnlyWallet } = useWallets();
  const { language, nativeCurrency, network } = useAccountSettings();

  const onSendFeedback = useSendFeedback();

  const handleVersionPress = useCallback(() => {
    versionPressHandle && clearTimeout(versionPressHandle);
    versionNumberOfTaps++;

    if (versionNumberOfTaps === 5) {
      onPressHiddenFeature();
    }

    versionPressHandle = setTimeout(() => {
      versionNumberOfTaps = 0;
    }, 3000);
  }, [onPressHiddenFeature]);

  const onPressReview = useCallback(async () => {
    if (RainbowRequestReview) {
      onCloseModal();
      RainbowRequestReview.requestReview(handled => {
        if (!handled) {
          Linking.openURL(SettingsExternalURLs.review);
        }
      });
    } else {
      const maxRequestCount = 2;
      const count = await getAppStoreReviewCount();
      const shouldDeeplinkToAppStore =
        count >= maxRequestCount || !StoreReview.isAvailable;

      if (shouldDeeplinkToAppStore && !isEmulatorSync()) {
        Linking.openURL(SettingsExternalURLs.review);
      } else {
        onCloseModal();
        InteractionManager.runAfterInteractions(StoreReview.requestReview);
      }

      return saveAppStoreReviewCount(count + 1);
    }
  }, [onCloseModal]);

  const onPressTwitter = useCallback(async () => {
    Linking.canOpenURL(SettingsExternalURLs.twitterDeepLink).then(supported =>
      supported
        ? Linking.openURL(SettingsExternalURLs.twitterDeepLink)
        : Linking.openURL(SettingsExternalURLs.twitterWebUrl)
    );
  }, []);

  return (
    <ScrollView
      contentContainerStyle={position.sizeAsObject('100%')}
      scrollEventThrottle={32}
      style={position.coverAsObject}
    >
      <ColumnWithDividers dividerRenderer={ListItemDivider} marginTop={8}>
        {!isReadOnlyWallet && (
          <ListItem
            icon={<SettingIcon source={BackupIcon} />}
            label="Backup"
            onPress={onPressBackup}
          >
            <ListItemArrowGroup>
              {/*


              XXX TODO: show this icon after a user has completed the "backup" user flow

              <Centered>
                <Icon
                  color={colors.blueGreyDark}
                  css={position.size(20)}
                  name="checkmarkCircled"
                />
              </Centered>
            */}
            </ListItemArrowGroup>
          </ListItem>
        )}
        <ListItem
          icon={<SettingIcon source={NetworkIcon} />}
          label="Network"
          onPress={onPressNetwork}
        >
          <ListItemArrowGroup>
            {get(networkInfo, `[${network}].name`)}
          </ListItemArrowGroup>
        </ListItem>
        <ListItem
          icon={<SettingIcon source={CurrencyIcon} />}
          label="Currency"
          onPress={onPressCurrency}
        >
          <ListItemArrowGroup>{nativeCurrency || ''}</ListItemArrowGroup>
        </ListItem>
        <ListItem
          icon={<SettingIcon source={LanguageIcon} />}
          label="Language"
          onPress={onPressLanguage}
        >
          <ListItemArrowGroup>
            {supportedLanguages[language] || ''}
          </ListItemArrowGroup>
        </ListItem>
        {/*
          <ListItemDivider />
          <ListItem
            icon={<SettingIcon source={SecurityIcon} />}
            onPress={onPressSecurity}
            label="Security"
          >
            <ListItemArrowGroup />
          </ListItem>
        */}
      </ColumnWithDividers>
      <ListFooter />
      <ColumnWithDividers dividerRenderer={ListItemDivider}>
        <ListItem
          icon={<Emoji name="rainbow" />}
          label="Follow Us on Twitter"
          onPress={onPressTwitter}
          value={SettingsExternalURLs.twitter}
        />
        <ListItem
          icon={<Emoji name="speech_balloon" />}
          label="Leave Feedback️"
          onPress={onSendFeedback}
        />
        <ListItem
          icon={<Emoji name="heart" />}
          label="Review Rainbow"
          onPress={onPressReview}
        />
      </ColumnWithDividers>
      {__DEV__ && (
        <ListItem
          justify="center"
          label="🐙 Developer settings 🐙"
          onPress={onPressDev}
        />
      )}
      <Column align="center" flex={1} justify="end" paddingBottom={19}>
        <TouchableWithoutFeedback onPress={handleVersionPress}>
          <AppVersionStamp />
        </TouchableWithoutFeedback>
      </Column>
    </ScrollView>
  );
};

export default SettingsSection;
