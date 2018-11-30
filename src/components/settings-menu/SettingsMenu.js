import React from 'react';
import {
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
  View,
} from 'react-native';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { BlurView } from 'react-native-blur';

import { withAccountSettings } from '../../hoc';
import { FlexItem, Row } from '../layout';
import { Text } from '../text';
import Icon from '../icons/Icon';
import SettingsSection from './SettingsSection';
import LanguageSection from './LanguageSection';
import CurrencySection from './CurrencySection';
import BackupSection from './BackupSection';
import { colors } from '../../styles';

// ======================================================================
// Styles
// ======================================================================

const ScreenWidth = Dimensions.get('window').width;
const OverlayWidth = ScreenWidth - 31;

const overlayStyles = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 15, 17, 0.5)',
};

const modalStyles = {
  display: 'flex',
  align: 'stretch',
  flex: 1,
  flexDirection: 'column',
};


  // padding-bottom: 16;
const Modal = styled(View)`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-top: 115;
  margin-left: 15;
  margin-right: 15;
  margin-bottom: 115;
  padding-top: 12;
  background: ${colors.white};
  border-radius: 12;
  shadow-color: ${colors.dark};
  shadow-opacity: 0.7;
  shadow-offset: 0px 10px;
  shadow-radius: 50;
  overflow: hidden;
`;
// ${padding(16)};

const Content = styled(View)`
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const HeaderRow = styled(Row).attrs({
  align: 'center',
})`
  align-content: space-between;
`;

const HeaderTitle = styled(Text).attrs({
  size: 'large',
  weight: 'bold',
})`
  margin-left: auto;
  margin-right: auto;
`;

const HeaderBackButton = styled(Icon).attrs({
  name: 'caret',
  direction: 'left',
  color: colors.appleBlue,
  height: 16,
})``;
// transform: rotate(180deg);

const HeaderBackText = styled(Text).attrs({
  size: 'large',
  weight: 'medium',
  color: 'appleBlue',
})`
  margin-left: 5;
`;

const HeaderAction = styled(Text).attrs({
  size: 'large',
  weight: 'medium',
  color: 'appleBlue',
})``;

const HeaderLeft = styled(TouchableOpacity)`
  position: absolute;
  left: 16;
  display: ${({ visible }) => (visible ? 'flex' : 'none')};
  flex-direction: row;
  align-items: center;
`;

const HeaderRight = styled(TouchableOpacity)`
  position: absolute;
  right: 16;
`;

const sectionStyles = {
  position: 'absolute',
  top: 39,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'hidden',
  // paddingLeft: 16,
  // paddingRight: 16,
};

// ======================================================================
// Component
// ======================================================================

class SettingsMenu extends React.Component {
  sections = {
    SETTINGS: 'Settings',
    LANGUAGE: 'Language',
    CURRENCY: 'Currency',
    BACKUP: 'Backup',
  };

  state = {
    section: this.props.section || this.sections.SETTINGS,
    settingsXValue: new Animated.Value(0),
    sectionXValue: new Animated.Value(OverlayWidth),
  };

  componentDidUpdate(prevProps) {
    if (prevProps.visible !== this.props.visible) {
      this.setState({
        section: this.sections.SETTINGS,
        settingsXValue: new Animated.Value(0),
        sectionXValue: new Animated.Value(OverlayWidth),
      });

      // Animate to last active section when SettingsMenu is opened
      // Example:
      // `navigator.navigate('WalletScreen', {settingsSection: 'Language'})`
      // ----
      // if (this.state.section !== this.sections.SETTINGS) {
      //   this.setState({
      //     settingsXValue: new Animated.Value(-OverlayWidth),
      //     sectionXValue: new Animated.Value(0)
      //   });
      // } else {
      //   this.setState({
      //     section: this.sections.SETTINGS,
      //     settingsXValue: new Animated.Value(0),
      //     sectionXValue: new Animated.Value(OverlayWidth)
      //   });
      // }
    }
  }

  onPressSection = section => () => {
    Animated.parallel([
      Animated.timing(this.state.settingsXValue, {
        toValue: -OverlayWidth,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        duration: 300,
        useNativeDriver: true,
      }).start(),
      Animated.timing(this.state.sectionXValue, {
        toValue: 0,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        duration: 300,
        useNativeDriver: true,
      }).start(),
    ]);

    this.setState({
      section,
    });
  };

  onPressBack = () => {
    Animated.parallel([
      Animated.timing(this.state.settingsXValue, {
        toValue: 0,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        duration: 300,
        useNativeDriver: true,
      }).start(),
      Animated.timing(this.state.sectionXValue, {
        toValue: OverlayWidth,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        duration: 300,
        useNativeDriver: true,
      }).start(),
    ]);

    this.setState({
      section: this.sections.SETTINGS,
    });
  };

  onSelectLanguage = language => {
    this.props.accountChangeLanguage(language);
  };

  renderActiveSection = () => {
    switch (this.state.section) {
      case this.sections.LANGUAGE:
        return (
          <LanguageSection
            language={this.props.language}
            onSelectLanguage={this.onSelectLanguage}
          />
        );

      case this.sections.CURRENCY:
        return (
          <CurrencySection
            nativeCurrency={this.props.nativeCurrency}
            onSelectCurrency={this.onSelectCurrency}
          />
        );

      case this.sections.BACKUP:
        return <BackupSection />;

      case this.sections.SETTINGS:
      default:
        return null;
    }
  };

  render() {
    console.log('SETTINGS MENU PROPS', this.props);

    if (!this.props.visible) {
      return null;
    }

    return (
      <Animated.View
        style={[overlayStyles, { opacity: this.props.overlayOpacity }]}
      >
        <BlurView style={overlayStyles} blurType="light" blurAmount={2} />
        <Animated.View
          style={[
            modalStyles,
            { transform: [{ translateY: this.props.modalYPosition }] },
          ]}
        >
          <Modal>
            <Content>
              <HeaderRow>
                <HeaderLeft
                  visible={this.state.section !== this.sections.SETTINGS}
                  onPress={this.onPressBack}
                >
                  <HeaderBackButton />
                  <HeaderBackText>Settings</HeaderBackText>
                </HeaderLeft>
                <HeaderTitle>{this.state.section}</HeaderTitle>
                <HeaderRight>
                  <HeaderAction onPress={this.props.onPressClose}>
                    Done
                  </HeaderAction>
                </HeaderRight>
              </HeaderRow>

              <Animated.View
                style={[
                  sectionStyles,
                  { transform: [{ translateX: this.state.settingsXValue }] },
                ]}
              >
                <SettingsSection
                  language={this.props.language}
                  nativeCurrency={this.props.nativeCurrency}
                  onPressBackup={this.onPressSection(this.sections.BACKUP)}
                  onPressLanguage={this.onPressSection(this.sections.LANGUAGE)}
                  onPressCurrency={this.onPressSection(this.sections.CURRENCY)}
                  onPressSecurity={this.onPressSection(this.sections.CURRENCY)}
                />
              </Animated.View>

              <Animated.View
                style={[
                  sectionStyles,
                  { transform: [{ translateX: this.state.sectionXValue }] },
                ]}
              >
                <FlexItem>
                  {this.renderActiveSection()}
                </FlexItem>
              </Animated.View>
            </Content>
          </Modal>
        </Animated.View>
      </Animated.View>
    );
  }
}

SettingsMenu.propTypes = {
  language: PropTypes.string.isRequired,
  nativeCurrency: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired,
  onPressClose: PropTypes.func.isRequired,
};

export default withAccountSettings(SettingsMenu);
