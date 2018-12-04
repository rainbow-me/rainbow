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
import { Modal, ModalHeader } from '../modal';

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

const Content = styled(View)`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  position: relative;
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

const HeaderLeft = styled(TouchableOpacity)`
  position: absolute;
  left: 16;
  display: ${({ visible }) => (visible ? 'flex' : 'none')};
  flex-direction: row;
  align-items: center;
`;

// ======================================================================
// Component
// ======================================================================

class SettingsMenu extends React.Component {


  onSelectLanguage = language => {
    this.props.accountChangeLanguage(language);
  };


              // <HeaderRow>
              //   <HEADERLEFT
              //     visible={this.state.section !== this.sections.SETTINGS}
              //     onPress={this.onPressBack}
              //   >
              //     <HeaderBackButton />
              //     <HeaderBackText>Settings</HeaderBackText>
              //   </HeaderLeft>
              //   <HeaderTitle>{this.state.section}</HeaderTitle>
              //   <HeaderRight>
              //     <HeaderAction onPress={this.props.onPressClose}>
              //       Done
              //     </HeaderAction>
              //   </HeaderRight>
              // </HeaderRow>


  render() {
    console.log('SETTINGS MENU PROPS', this.props);

    // if (!this.props.visible) {
    //   return null;
    // }
        // <BlurView style={overlayStyles} blurType="light" blurAmount={2} />
        //
        //

    return (
      <Modal>
        <Content>
          <ModalHeader
            onPressBack={this.onPressBack}
            onPressClose={this.props.onPressClose}
            style={{ marginBottom: 8 }}
            title={this.state.section}
          />
        </Content>
      </Modal>
    );
  }
}

SettingsMenu.propTypes = {
  language: PropTypes.string.isRequired,
  nativeCurrency: PropTypes.string.isRequired,
  onPressClose: PropTypes.func.isRequired,
};

export default (SettingsMenu);
