import { upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { InteractionManager, Linking, ScrollView } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import FastImage from 'react-native-fast-image';
import * as StoreReview from 'react-native-store-review';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
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
import { withAccountSettings, withSendFeedback } from '../../hoc';
import { supportedLanguages } from '../../languages';
import { position } from '../../styles';
import AppVersionStamp from '../AppVersionStamp';
import { Column, ColumnWithDividers } from '../layout';
import {
  ListFooter,
  ListItem,
  ListItemArrowGroup,
  ListItemDivider,
} from '../list';
import { Emoji } from '../text';

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
  margin-right: -6;
  margin-top: 6.5;
`;

const SettingsSection = ({
  language,
  nativeCurrency,
  network,
  onPressBackup,
  onPressCurrency,
  onPressImportSeedPhrase,
  onPressLanguage,
  onPressNetwork,
  onPressReview,
  onPressTwitter,
  onSendFeedback,
}) => (
  <ScrollView
    contentContainerStyle={position.sizeAsObject('100%')}
    scrollEventThrottle={32}
    style={position.coverAsObject}
  >
    <ColumnWithDividers dividerRenderer={ListItemDivider} marginTop={8}>
      <ListItem
        icon={<SettingIcon source={BackupIcon} />}
        onPress={onPressBackup}
        label="Backup"
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
      <ListItem
        icon={<SettingIcon source={NetworkIcon} />}
        onPress={onPressNetwork}
        label="Network"
      >
        <ListItemArrowGroup>{upperFirst(network) || ''}</ListItemArrowGroup>
      </ListItem>
      <ListItem
        icon={<SettingIcon source={CurrencyIcon} />}
        onPress={onPressCurrency}
        label="Currency"
      >
        <ListItemArrowGroup>{nativeCurrency || ''}</ListItemArrowGroup>
      </ListItem>
      <ListItem
        icon={<SettingIcon source={LanguageIcon} />}
        onPress={onPressLanguage}
        label="Language"
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
        icon={<Emoji name="seedling" />}
        label="Replace Wallet"
        onPress={onPressImportSeedPhrase}
      />
      <ListItem
        icon={<Emoji name="rainbow" />}
        label="Follow Us"
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
    <Column align="center" flex={1} justify="end" paddingBottom={24}>
      <AppVersionStamp />
    </Column>
  </ScrollView>
);

SettingsSection.propTypes = {
  language: PropTypes.string.isRequired,
  nativeCurrency: PropTypes.string.isRequired,
  network: PropTypes.string.isRequired,
  onPressBackup: PropTypes.func.isRequired,
  onPressCurrency: PropTypes.func.isRequired,
  onPressImportSeedPhrase: PropTypes.func.isRequired,
  onPressLanguage: PropTypes.func.isRequired,
  onPressNetwork: PropTypes.func,
  onPressReview: PropTypes.func,
  // onPressSecurity: PropTypes.func.isRequired,
  onPressTwitter: PropTypes.func,
  onSendFeedback: PropTypes.func.isRequired,
};

SettingsSection.defaultProps = {
  // XXX TODO: Delete this default once testnet support exists
  network: 'Mainnet',
};

export default compose(
  withAccountSettings,
  withSendFeedback,
  withHandlers({
    onPressReview: ({ onCloseModal }) => async () => {
      const maxRequestCount = 2;
      const count = await getAppStoreReviewCount();
      const shouldDeeplinkToAppStore =
        count >= maxRequestCount || !StoreReview.isAvailable;

      if (shouldDeeplinkToAppStore && !DeviceInfo.isEmulator()) {
        Linking.openURL(SettingsExternalURLs.review);
      } else {
        onCloseModal();
        InteractionManager.runAfterInteractions(StoreReview.requestReview);
      }

      return saveAppStoreReviewCount(count + 1);
    },
    onPressTwitter: () => async () => {
      Linking.canOpenURL(SettingsExternalURLs.twitterDeepLink).then(supported =>
        supported
          ? Linking.openURL(SettingsExternalURLs.twitterDeepLink)
          : Linking.openURL(SettingsExternalURLs.twitterWebUrl)
      );
    },
  }),
  onlyUpdateForKeys(['language', 'nativeCurrency'])
)(SettingsSection);
