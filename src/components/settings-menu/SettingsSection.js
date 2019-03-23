import PropTypes from 'prop-types';
import { supportedLanguages } from '@rainbow-me/rainbow-common';
import React from 'react';
import { Linking, ScrollView } from 'react-native';
import FastImage from 'react-native-fast-image';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import BackupIcon from '../../assets/backup-icon.png';
import CurrencyIcon from '../../assets/currency-icon.png';
import LanguageIcon from '../../assets/language-icon.png';
// import SecurityIcon from '../../assets/security-icon.png';
import { withAccountSettings } from '../../hoc';
import { position } from '../../styles';
import AppVersionStamp from '../AppVersionStamp';
import { Icon } from '../icons';
import { Column } from '../layout';
import {
  ListFooter,
  ListItem,
  ListItemArrowGroup,
  ListItemDivider,
} from '../list';
import { Emoji } from '../text';

const SettingsExternalURLs = {
  about: 'http://rainbow.me',
  feedback: 'http://rainbow.me',
  legal: 'https://github.com/rainbow-me/rainbow/blob/master/LICENSE',
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
  onPressBackup,
  onPressCurrency,
  onPressImportSeedPhrase,
  onPressLanguage,
  // onPressSecurity,
  openWebView,
  ...props
}) => (
  <ScrollView
    contentContainerStyle={position.sizeAsObject('100%')}
    style={position.coverAsObject}
  >
    <Column style={{ marginTop: 8 }}>
      <ListItem
        icon={<SettingIcon source={BackupIcon} />}
        onPress={onPressBackup}
        label="Backup"
      >
        <ListItemArrowGroup>
          <Icon
            color="blueGreyDark"
            name="checkmarkCircled"
            style={{ marginBottom: -5 }}
          />
        </ListItemArrowGroup>
      </ListItem>
      <ListItemDivider />
      <ListItem
        icon={<SettingIcon source={CurrencyIcon} />}
        onPress={onPressCurrency}
        label="Currency"
      >
        <ListItemArrowGroup>
          {nativeCurrency || ''}
        </ListItemArrowGroup>
      </ListItem>
      <ListItemDivider />
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
    </Column>
    <ListFooter />
    <Column>
      <ListItem
        icon={<Emoji name="seedling" />}
        label="Import Seed Phrase"
        onPress={onPressImportSeedPhrase}
      />
      <ListItemDivider />
      <ListItem
        icon={<Emoji name="rainbow" />}
        label="About Rainbow"
        onPress={openWebView}
        value={SettingsExternalURLs.about}
      />
      <ListItemDivider />
      <ListItem
        icon={<Emoji name="heart" />}
        label="Leave Feedback️"
        onPress={openWebView}
        value={SettingsExternalURLs.feedback}
      />
      <ListItemDivider />
      <ListItem
        icon={<Emoji name="page_with_curl" />}
        label="Legal"
        onPress={openWebView}
        value={SettingsExternalURLs.legal}
      />
    </Column>
    <Column
      align="center"
      flex={1}
      justify="end"
      style={{ paddingBottom: 24 }}
    >
      <AppVersionStamp />
    </Column>
  </ScrollView>
);

SettingsSection.propTypes = {
  language: PropTypes.string.isRequired,
  nativeCurrency: PropTypes.string.isRequired,
  onPressBackup: PropTypes.func.isRequired,
  onPressCurrency: PropTypes.func.isRequired,
  onPressImportSeedPhrase: PropTypes.func.isRequired,
  onPressLanguage: PropTypes.func.isRequired,
  // onPressSecurity: PropTypes.func.isRequired,
  openWebView: PropTypes.func,
};

export default compose(
  withAccountSettings,
  withHandlers({ openWebView: () => uri => Linking.openURL(uri) }),
  onlyUpdateForKeys(['language', 'nativeCurrency']),
)(SettingsSection);
