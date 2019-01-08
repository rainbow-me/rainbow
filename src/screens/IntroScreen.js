import PropTypes from 'prop-types';
import React from 'react';
import {
  Clipboard,
  KeyboardAvoidingView,
  Linking,
  TextInput,
  TouchableOpacity
} from 'react-native';
import lang from 'i18n-js';
import { withNavigation } from 'react-navigation';
import { compose } from 'recompact';
import styled from 'styled-components';
import Icon from '../components/icons/Icon';
import { Column } from '../components/layout';
import { Text } from '../components/text';
import { colors, fonts, padding } from '../styles';

const Container = styled(Column).attrs({ align: 'center' })`
  display: flex;
  flex: 1;
  flex-direction: column;
  ${padding(16)};
  padding-top: 0;
  background: ${colors.white};
  border-top-left-radius: 12;
  border-top-right-radius: 12;
`;

const HandleIcon = styled(Icon).attrs({
  name: 'handle',
  color: '#C4C6CB',
})`
  margin-top: 16px;
  margin-bottom: 2;
`;

const Body = styled(Column).attrs({
  align: 'center',
})`
  margin-right: 50;
  margin-left: 50;
  margin-top: auto;
  margin-bottom: auto;
`;

const CreateWalletButton = styled.View`
  ${padding(14, 18, 17)}
  background-color: ${colors.teal};
  border-radius: 14;
  margin-top: 47;
`;

const Input = styled(TextInput).attrs({
  autoCapitalize: false,
  autoCorrect: false,
  multiline: true,
  placeholderTextColor: '#C4C6CB',
  spellCheck: true,
})`
  font-family: ${fonts.family['SFProText']};
  font-weight: ${fonts.weight.semibold};
  font-size: ${fonts.size.large};
  margin-bottom: 20;
  text-align: center;
  line-height: 25;
`;

const HelpText = styled(Text).attrs({
  size: 'medium',
  weight: 'medium',
  color: '#636875',
})`
  text-align: center;
`;

const Footer = styled(KeyboardAvoidingView).attrs({
  behavior: 'padding',
  keyboardVerticalOffset: 80,
})`
  display: flex;
  align-self: stretch;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
`;

const HelpButton = styled(TouchableOpacity)`
  padding-left: 8;
  padding-right: 8;
  padding-top: 6;
  padding-bottom: 6;
  border: 1px solid #f6f7f7;
  border-radius: 15px;
`;

const ImportButton = styled(TouchableOpacity)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-left: 8;
  padding-right: 8;
  padding-top: 6;
  padding-bottom: 6;
  background: ${props => (props.disabled ? '#D2D3D7' : colors.appleBlue)};
  border-radius: 15px;
  shadow-color: ${colors.dark};
  shadow-offset: 0px 6px;
  shadow-opacity: 0.14;
  shadow-radius: 10;
`;

const ImportIcon = styled(Icon).attrs({
  name: 'arrowCircled',
  color: colors.white,
  direction: 'right',
  style: { paddingRight: '5' },
})``;

const ImportText = styled(Text).attrs({
  size: 'medium',
  weight: 'bold',
})`
  color: ${colors.white};
  padding-left: ${({ padding }) => (padding ? 5 : 0)};
`;

class IntroScreen extends React.Component {
  static propTypes = {
    screenProps: PropTypes.objectOf({
      handleWalletConfig: PropTypes.func,
    }),
    navigation: PropTypes.object,
  };

  state = {
    seedPhrase: '',
  };

  isSeedPhraseValid = () => {
    const phraseCount = this.state.seedPhrase
      .split(' ')
      .filter(word => word !== '').length;
    return phraseCount >= 12 && phraseCount <= 24;
  };

  onImportSeedPhrase = () => {
    this.props.screenProps
      .handleWalletConfig(this.state.seedPhrase)
      .then(address => {
        if (address) {
          this.props.navigation.navigate('WalletScreen');
        }
      })
  };

  onChangeSeedPhrase = seedPhrase => {
    this.setState({ seedPhrase });
  };

  onPasteSeedPhrase = () => {
    Clipboard.getString()
      .then(this.onChangeSeedPhrase)
      .catch(error => {
        console.log(error);
      });
  };

  onPressHelp = () => {
    Linking.openURL('https://support.balance.io');
  };

  renderImportButton = () => {
    if (this.state.seedPhrase !== '') {
      return (
        <ImportButton
          disabled={!this.isSeedPhraseValid()}
          onPress={this.onImportSeedPhrase}
        >
          <ImportIcon />
          <ImportText padding>Import</ImportText>
        </ImportButton>
      );
    } else {
      return (
        <ImportButton onPress={this.onPasteSeedPhrase}>
          <ImportText>Paste</ImportText>
        </ImportButton>
      );
    }
  };

  render() {
    return (
      <Container>
        <HandleIcon />
        <Text size="large" weight="bold">
          Import
        </Text>
        <Body>
          <Input
            autoFocus
            value={this.state.seedPhrase}
            placeholder={'Type your seed phrase'}
            onChangeText={this.onChangeSeedPhrase}
          />
        </Body>
        <Footer>
          <HelpButton onPress={this.onPressHelp}>
            <HelpText>Help</HelpText>
          </HelpButton>
          {this.renderImportButton()}
        </Footer>
      </Container>
    );
  }
}

export default compose(withNavigation)(IntroScreen);
