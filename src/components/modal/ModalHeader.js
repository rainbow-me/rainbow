import {
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'react-native-blur';

// import { withAccountSettings } from '../../hoc';
// import { FlexItem, Row } from '../layout';
// import Icon from '../icons/Icon';
// import SettingsSection from './SettingsSection';
// import LanguageSection from './LanguageSection';
// import CurrencySection from './CurrencySection';
// import BackupSection from './BackupSection';
// import { colors } from '../../styles';


import PropTypes from 'prop-types';
import React from 'react';
import { compose, setPropTypes, withProps, withHandlers } from 'recompact';
import styled from 'styled-components';
import { colors, fonts, padding, position } from '../../styles';
// import Icon from '../icons/Icon';
import { Centered, FlexItem, Row } from '../layout';
import { Text, TruncatedText } from '../text';
import ModalHeaderButton from './ModalHeaderButton';

const ModalHeaderHeight = 54;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
  flex: 0,
})`
  background-color: ${colors.white};
  flex-shrink: 0;
  height: ${ModalHeaderHeight};
  width: 100%;
`;


// const HeaderAction = styled(Row).attrs({
//   align: 'center',
//   component: TouchableOpacity,
// })`
//   flex: 1;
// `;

// const HeaderLeft = styled(TouchableOpacity)`
//   position: absolute;
//   left: 16;
//   display: ${({ visible }) => (visible ? 'flex' : 'none')};
//   flex-direction: row;
//   align-items: center;
// `;

  // ${position.cover};

const Center = styled(Centered)`
  ${position.cover};
  zIndex: 0;
`;

const TitleText = styled(TruncatedText).attrs({
  size: 'large',
  weight: 'bold',
})`
  height: 21;
  letter-spacing: -0.2px;
`;


        // <HeaderBackButton />

const ModalHeader = ({ onPressBack, onPressClose, title, ...props }) => {

  return (
    <Container {...props}>
      <ModalHeaderButton
        onPress={onPressBack}
        showBackArrow
        side="left"
      >
        Settings
      </ModalHeaderButton>
      <Center>
        <TitleText>{title}</TitleText>
      </Center>
      <ModalHeaderButton onPress={onPressClose} side="right">
        Done
      </ModalHeaderButton>
    </Container>
  );
};

ModalHeader.propTypes = {
  onPressBack: PropTypes.func,
  onPressClose: PropTypes.func,
  title: PropTypes.string,
};

ModalHeader.height = ModalHeaderHeight;

export default ModalHeader;
