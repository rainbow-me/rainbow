import React from 'react';
import { Linking, TouchableOpacity, Image } from 'react-native';
import { withNavigation } from 'react-navigation';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Column, Row } from '../layout';
import { Text } from '../text';
import Icon from '../icons/Icon';
import { LANGUAGES } from '../../utils/constants';
import { colors, padding } from '../../styles';

import BackupIcon from '../../assets/backup-icon.png';
import CurrencyIcon from '../../assets/currency-icon.png';
import LanguageIcon from '../../assets/language-icon.png';
import SecurityIcon from '../../assets/security-icon.png';

// ======================================================================
// Styles
// ======================================================================

const SettingGroup = styled(Column)`
  margin-bottom: 26;
`;

const SettingRow = styled(Row).attrs({
  align: 'center',
  justify: 'start',
})`
  align-self: stretch;
  ${padding(14, 0)};
`;

// NOTE:
// I was having issues getting :last-child to properly
// remove borders, so I'm using `props.border` as a workaround.
// @hoodsy
const SettingButton = styled(TouchableOpacity)`
  border-bottom-width: ${({ border }) => (border ? 1 : 0)};
  border-bottom-color: ${colors.lightGrey};
`;

const PrimarySettingRow = styled(SettingRow)`
  ${padding(10, 0)};
`;

const SettingRowIcon = styled(Image)`
  width: 44;
  height: 44;
  margin-left: -6;
  margin-right: 3;
  margin-bottom: -9;
`;

const SettingRowLabel = styled(Text).attrs({
  size: 'h5',
})``;

const SettingArrowGroup = styled(Row).attrs({
  align: 'center',
  justify: 'center',
})`
  margin-left: auto;
  opacity: 0.6;
`;

const SettingRowValue = styled(Text).attrs({
  size: 'h5',
  color: colors.blueGreyDark,
})`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-right: 6;
`;

const SettingRowArrow = styled(Icon).attrs({
  name: 'caretThin',
  color: colors.blueGreyDark,
})``;

const BackupRowIcon = styled(Icon).attrs({
  name: 'checkmarkCircled',
  color: colors.blueGreyDark,
})`
  margin-bottom: -5;
`;

const SettingRowEmoji = styled(Text).attrs({
  size: 'h5',
})`
  margin-right: 8;
`;

// ======================================================================
// Component
// ======================================================================

class SettingsSection extends React.Component {
  webviews = {
    ABOUT: 'https://balance.io/about',
    FEEDBACK: 'support@balance.io',
    LEGAL: 'https://github.com/balance-io/balance-wallet/blob/master/LICENSE',
  };

  openWebView = uri => () => {
    Linking.openURL(uri);
    // this.props.navigation.navigate("WebView", { uri });
  };

  render() {
    const {
      language,
      nativeCurrency,
      onPressBackup,
      onPressLanguage,
      onPressCurrency,
      onPressSecurity,
    } = this.props;
    return (
      <Column>
        <SettingGroup>
          <SettingButton border onPress={onPressBackup}>
            <PrimarySettingRow>
              <SettingRowIcon source={BackupIcon} />
              <SettingRowLabel>Backup</SettingRowLabel>
              <SettingArrowGroup>
                <SettingRowValue>
                  <BackupRowIcon />
                </SettingRowValue>
                <SettingRowArrow />
              </SettingArrowGroup>
            </PrimarySettingRow>
          </SettingButton>

          <SettingButton border onPress={onPressCurrency}>
            <PrimarySettingRow>
              <SettingRowIcon source={CurrencyIcon} />
              <SettingRowLabel>Currency</SettingRowLabel>
              <SettingArrowGroup>
                <SettingRowValue>{nativeCurrency || ''}</SettingRowValue>
                <SettingRowArrow />
              </SettingArrowGroup>
            </PrimarySettingRow>
          </SettingButton>

          <SettingButton onPress={onPressLanguage}>
            <PrimarySettingRow>
              <SettingRowIcon source={LanguageIcon} />
              <SettingRowLabel>Language</SettingRowLabel>
              <SettingArrowGroup>
                <SettingRowValue>{LANGUAGES[language] || ''}</SettingRowValue>
                <SettingRowArrow />
              </SettingArrowGroup>
            </PrimarySettingRow>
          </SettingButton>

          {/*
            <SettingButton onPress={onPressSecurity}>
            <PrimarySettingRow>
              <SettingRowIcon source={SecurityIcon} />
              <SettingRowLabel>Security</SettingRowLabel>
              <SettingArrowGroup>
                <SettingRowArrow />
              </SettingArrowGroup>
            </PrimarySettingRow>
          </SettingButton>
        */}
        </SettingGroup>

        <SettingGroup>
          <SettingButton onPress={this.openWebView(this.webviews.ABOUT)} border>
            <SettingRow>
              <SettingRowEmoji>⚖</SettingRowEmoji>
              <SettingRowLabel>About Balance</SettingRowLabel>
            </SettingRow>
          </SettingButton>
          <SettingButton
            onPress={this.openWebView(this.webviews.FEEDBACK)}
            border
          >
            <SettingRow>
              <SettingRowEmoji>❤️</SettingRowEmoji>
              <SettingRowLabel>Leave Feedback️</SettingRowLabel>
            </SettingRow>
          </SettingButton>
          <SettingButton onPress={this.openWebView(this.webviews.LEGAL)}>
            <SettingRow>
              <SettingRowEmoji>📃</SettingRowEmoji>
              <SettingRowLabel>Legal</SettingRowLabel>
            </SettingRow>
          </SettingButton>
        </SettingGroup>
      </Column>
    );
  }
}

SettingsSection.propTypes = {
  nativeCurrency: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  navigation: PropTypes.object.isRequired,
  onPressBackup: PropTypes.func.isRequired,
  onPressCurrency: PropTypes.func.isRequired,
  onPressLanguage: PropTypes.func.isRequired,
};

export default withNavigation(SettingsSection);
