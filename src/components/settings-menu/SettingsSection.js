import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { InteractionManager, Linking, ScrollView, View } from 'react-native';
import { isEmulatorSync } from 'react-native-device-info';
import FastImage from 'react-native-fast-image';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import * as StoreReview from 'react-native-store-review';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import BackupIcon from '../../assets/settingsBackup.png';
import CurrencyIcon from '../../assets/settingsCurrency.png';
import LanguageIcon from '../../assets/settingsLanguage.png';
import NetworkIcon from '../../assets/settingsNetwork.png';
// import SecurityIcon from '../../assets/security-icon.png';
import {
  getAppStoreReviewCount,
  saveAppStoreReviewCount,
} from '../../handlers/localstorage/globalSettings';
import networkInfo from '../../helpers/networkInfo';
import { withAccountSettings, withSendFeedback } from '../../hoc';
import useWallets from '../../hooks/useAccountProfile';
import { supportedLanguages } from '../../languages';
import { colors, position } from '../../styles';
import AppVersionStamp from '../AppVersionStamp';
import { Icon } from '../icons';
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
  margin-right: -4;
  margin-top: 8;
`;

let versionPressHandle = null;
let versionNumberOfTaps = 0;

const IconWrapper = styled(View)`
  height: 22;
  margin-top: 2;
  right: 8.7;
  top: 0;
  width: 22;
`;

const WarningIcon = () => (
  <IconWrapper>
    <Icon color={colors.yellowOrange} name="warningCircled" size={40} />
  </IconWrapper>
);
const CheckmarkIcon = () => (
  <IconWrapper>
    <Icon color={colors.green} name="checkmarkCircled" size={22} />
  </IconWrapper>
);

const checkIfAllWalletsBackedUp = wallets => {
  if (!wallets) return false;
  let backedUp = true;
  Object.keys(wallets).forEach(key => {
    if (wallets[key].backedUp === false && !wallets[key].imported) {
      backedUp = false;
    }
  });
  console.log('backedUp', backedUp);
  return backedUp;
};

const SettingsSection = ({
  language,
  nativeCurrency,
  network,
  onPressBackup,
  onPressCurrency,
  onPressHiddenFeature,
  onPressIcloudBackup,
  onPressLanguage,
  onPressNetwork,
  onPressReview,
  onPressShowSecret,
  onPressTwitter,
  onSendFeedback,
}) => {
  const { wallets } = useWallets();

  const handleVersionPress = () => {
    versionPressHandle && clearTimeout(versionPressHandle);
    versionNumberOfTaps++;

    if (versionNumberOfTaps === 5) {
      onPressHiddenFeature();
    }

    versionPressHandle = setTimeout(() => {
      versionNumberOfTaps = 0;
    }, 3000);
  };

  const allWalletsBackedUp = useMemo(() => checkIfAllWalletsBackedUp(wallets), [
    wallets,
  ]);

  return (
    <ScrollView
      contentContainerStyle={position.sizeAsObject('100%')}
      scrollEventThrottle={32}
      style={position.coverAsObject}
    >
      <ColumnWithDividers dividerRenderer={ListItemDivider} marginTop={8}>
        <ListItem
          icon={<SettingIcon source={BackupIcon} />}
          onPress={onPressBackup}
          onPressIcloudBackup={onPressIcloudBackup}
          onPressShowSecret={onPressShowSecret}
          label="Backup"
        >
          <ListItemArrowGroup>
            {allWalletsBackedUp ? <CheckmarkIcon /> : <WarningIcon />}
          </ListItemArrowGroup>
        </ListItem>
        <ListItem
          icon={<SettingIcon source={NetworkIcon} />}
          onPress={onPressNetwork}
          label="Network"
        >
          <ListItemArrowGroup>
            {get(networkInfo, `[${network}].name`)}
          </ListItemArrowGroup>
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
      <Column align="center" flex={1} justify="end" paddingBottom={19}>
        <TouchableWithoutFeedback onPress={handleVersionPress}>
          <AppVersionStamp />
        </TouchableWithoutFeedback>
      </Column>
    </ScrollView>
  );
};

SettingsSection.propTypes = {
  language: PropTypes.string.isRequired,
  nativeCurrency: PropTypes.string.isRequired,
  network: PropTypes.string.isRequired,
  onPressBackup: PropTypes.func.isRequired,
  onPressCurrency: PropTypes.func.isRequired,
  onPressHiddenFeature: PropTypes.func.isRequired,
  onPressLanguage: PropTypes.func.isRequired,
  onPressNetwork: PropTypes.func,
  onPressReview: PropTypes.func,
  // onPressSecurity: PropTypes.func.isRequired,
  onPressTwitter: PropTypes.func,
  onSendFeedback: PropTypes.func.isRequired,
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

      if (shouldDeeplinkToAppStore && !isEmulatorSync()) {
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
  onlyUpdateForKeys(['language', 'nativeCurrency', 'network'])
)(SettingsSection);
