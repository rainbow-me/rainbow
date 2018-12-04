import React from 'react';
import { Linking, ScrollView, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import { withNavigation } from 'react-navigation';
import { compose, withHandlers } from 'recompact';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Centered, Column, FlexItem, Row } from '../layout';
import { Emoji, Text } from '../text';
import Icon from '../icons/Icon';
import { LANGUAGES } from '../../utils/constants';
import { colors, fonts, margin, padding, position } from '../../styles';

import BackupIcon from '../../assets/backup-icon.png';
import CurrencyIcon from '../../assets/currency-icon.png';
import LanguageIcon from '../../assets/language-icon.png';
import SecurityIcon from '../../assets/security-icon.png';

import { ListFooter, ListItem, ListItemDivider, SectionList } from '../list';

// ======================================================================
// Styles
// ======================================================================

// Beware: magic numbers lol
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


  // display: flex;
  // flex-direction: row;
  // justify-content: center;
  // align-items: center;


const BackupRowIcon = styled(Icon).attrs({
  name: 'checkmarkCircled',
  color: colors.blueGreyDark,
})`
  margin-bottom: -5;
`;

const URLs = {
  ABOUT: 'https://balance.io/about',
  FEEDBACK: 'support@balance.io',
  LEGAL: 'https://github.com/balance-io/balance-wallet/blob/master/LICENSE',
};

// ======================================================================
// Component
// ======================================================================

const SettingsSection = ({
  language,
  nativeCurrency,
  onPressBackup,
  onPressCurrency,
  onPressLanguage,
  onPressSecurity,
  openWebView,
  ...props,
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
      <ListItem
        icon={<SettingIcon source={LanguageIcon} />}
        onPress={onPressLanguage}
        label="Language"
      >
        <ArrowGroup>
          {LANGUAGES[language] || ''}
        </ArrowGroup>
      </ListItem>
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
        value={URLs.ABOUT}
      />
      <ListItemDivider />
      <ListItem
        icon={<Emoji name="heart" />}
        label="Leave Feedback️"
        onPress={openWebView}
        value={URLs.FEEDBACK}
      />
      <ListItemDivider />
      <ListItem
        icon={<Emoji name="page_with_curl" />}
        label="Legal"
        onPress={openWebView}
        value={URLs.LEGAL}
      />
    </Column>
  </ScrollView>
);

SettingsSection.propTypes = {
  language: PropTypes.string.isRequired,
  nativeCurrency: PropTypes.string.isRequired,
  navigation: PropTypes.object.isRequired,
  onPressBackup: PropTypes.func.isRequired,
  onPressCurrency: PropTypes.func.isRequired,
  onPressLanguage: PropTypes.func.isRequired,
  openWebView: PropTypes.func,
};

export default compose(
  // withNavigation,
  withHandlers({
    openWebView: () => (uri) => Linking.openURL(uri),
  }),
)(SettingsSection);
