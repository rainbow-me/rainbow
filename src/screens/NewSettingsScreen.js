import { filter } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component} from 'react';
import {
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  View,
} from 'react-native';
import { createStackNavigator } from 'react-navigation';
import { compose, defaultProps, withHandlers, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import {
  BackupSection,
  CurrencySection,
  LanguageSection,
  SettingsMenu,
  SettingsSection,
} from '../components/settings-menu';
import { Centered, Column, FlexItem } from '../components/layout';
import { withAccountSettings } from '../hoc';
import { colors, padding, position } from '../styles';
import { deviceUtils } from '../utils';
import { Modal, ModalHeader } from '../components/modal';

const ScreenWidth = Dimensions.get('window').width;
const OverlayWidth = ScreenWidth - 31;

const BackgroundButton = styled(TouchableOpacity)`
  ${position.cover}
  z-index: 0;
`;

const Content = styled(Column)`
  flex: 1;
  overflow: hidden;
`;

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${({ containerPadding }) => padding(containerPadding)};
  background-color: transparent;
  height: 100%;
`;

const sectionStyles = {
  position: 'absolute',
  top: ModalHeader.height,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'hidden',
  // paddingLeft: 16,
  // paddingRight: 16,
};

class NewSettingsScreen extends Component {
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
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        toValue: -OverlayWidth,
        useNativeDriver: true,
      }).start(),
      Animated.timing(this.state.sectionXValue, {
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        toValue: 0,
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
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        toValue: 0,
        useNativeDriver: true,
      }).start(),
      Animated.timing(this.state.sectionXValue, {
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        toValue: OverlayWidth,
        useNativeDriver: true,
      }).start(),
    ]);

    this.setState({
      section: this.sections.SETTINGS,
    });
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

  render = () => {
    const {
      containerPadding,
      onCloseModal,
      panelWidth,
      type,
      ...props
    } = this.props;

    const expandedStateProps = {
      ...props,
      panelWidth,
    };

    return (
      <Container containerPadding={containerPadding}>
        <StatusBar barStyle="light-content" />
        <BackgroundButton onPress={onCloseModal} />
        <Modal>
          <Content>
            <ModalHeader
              onPressBack={this.onPressBack}
              onPressClose={onCloseModal}
              title={this.state.section}
            />
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
                onPressCurrency={this.onPressSection(this.sections.CURRENCY)}
                onPressLanguage={this.onPressSection(this.sections.LANGUAGE)}
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
      </Container>
    );
  }
}

NewSettingsScreen.propTypes = {
  asset: PropTypes.object,
  containerPadding: PropTypes.number.isRequired,
  onPressBackground: PropTypes.func,
  panelWidth: PropTypes.number,
  type: PropTypes.oneOf(['token', 'unique_token']),
};

const NewSettingsScreenDefaultProps = {
  containerPadding: 15,
};

NewSettingsScreen.defaultProps = NewSettingsScreenDefaultProps;

export default compose(
  defaultProps(NewSettingsScreenDefaultProps),
  withAccountSettings,
  withHandlers({
    onCloseModal: ({ navigation }) => () => navigation.goBack(),
  }),
)(NewSettingsScreen);

