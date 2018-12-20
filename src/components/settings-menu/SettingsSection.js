import { supportedLanguages } from 'balance-common';
import PropTypes from 'prop-types';
import React from 'react';
import { Linking, ScrollView } from 'react-native';
import FastImage from 'react-native-fast-image';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import styled from 'styled-components';
import BackupIcon from '../../assets/backup-icon.png';
import CurrencyIcon from '../../assets/currency-icon.png';
import LanguageIcon from '../../assets/language-icon.png';
// import SecurityIcon from '../../assets/security-icon.png';
import { withAccountSettings } from '../../hoc';
import { colors, position } from '../../styles';

import Icon from '../icons/Icon';
import { Column, Row } from '../layout';
import { ListFooter, ListItem, ListItemDivider } from '../list';
import { Emoji, Text } from '../text';

const SettingsExternalURLs = {
  about: 'https://balance.io/about',
  feedback: 'support@balance.io',
  legal: 'https://github.com/balance-io/balance-wallet/blob/master/LICENSE',
};

const BackupRowIcon = styled(Icon).attrs({
  color: colors.blueGreyDark,
  name: 'checkmarkCircled',
})`
  margin-bottom: -5;
`;

// ⚠️ Beware: magic numbers lol
const SettingIcon = styled(FastImage)`
  ${position.size(44)};
  margin-left: -6;
  margin-right: -6;
  margin-top: 6.5;
`;

const ArrowGroup = ({ children }) => (
  <Row align="center" justify="end" style={{ opacity: 0.6 }}>
    <Text color="blueGreyDark" size="bmedium" style={{ marginRight: 6 }}>
      {children}
    </Text>
    <Icon
      color={colors.blueGreyDark}
      name="caretThin"
      style={{ width: 11 }}
    />
  </Row>
);

ArrowGroup.propTypes = {
  children: PropTypes.node,
};

const SettingsSection = ({
  language,
  nativeCurrency,
  onPressBackup,
  onPressCurrency,
  onPressLanguage,
  // onPressSecurity,
  openWebView,
  ...props
}) => (
  <ScrollView style={position.coverAsObject}>
    <Column style={{ marginTop: 8 }}>
      <ListItem
        icon={<SettingIcon source={BackupIcon} />}
        onPress={onPressBackup}
        label="Backup"
      >
        <ArrowGroup>
          <BackupRowIcon />
        </ArrowGroup>
      </ListItem>
      <ListItemDivider />
      <ListItem
        icon={<SettingIcon source={CurrencyIcon} />}
        onPress={onPressCurrency}
        label="Currency"
      >
        <ArrowGroup>
          {nativeCurrency || ''}
        </ArrowGroup>
      </ListItem>
      <ListItemDivider />
      {/*<ListItem
        icon={<SettingIcon source={LanguageIcon} />}
        onPress={onPressLanguage}
        label="Language"
      >
        <ArrowGroup>
          {supportedLanguages[language] || ''}
        </ArrowGroup>
      </ListItem>*/}
      {/*
        <ListItemDivider />
        <ListItem
          icon={<SettingIcon source={SecurityIcon} />}
          onPress={onPressSecurity}
          label="Security"
        >
          <ArrowGroup />
        </ListItem>
      */}
    </Column>
    <ListFooter />
    <Column>
      <ListItem
        icon={<Emoji name="scales" />}
        label="About Balance"
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
  </ScrollView>
);

SettingsSection.propTypes = {
  language: PropTypes.string.isRequired,
  nativeCurrency: PropTypes.string.isRequired,
  onPressBackup: PropTypes.func.isRequired,
  onPressCurrency: PropTypes.func.isRequired,
  onPressLanguage: PropTypes.func.isRequired,
  // onPressSecurity: PropTypes.func.isRequired,
  openWebView: PropTypes.func,
};

export default compose(
  withAccountSettings,
  withHandlers({ openWebView: () => uri => Linking.openURL(uri) }),
  onlyUpdateForKeys(['language', 'nativeCurrency']),
)(SettingsSection);
