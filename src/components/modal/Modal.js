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
import { colors } from '../../styles';
import { deviceUtils } from '../../utils';

//padding-top: 12;
const Container = styled(View)`
  background: ${colors.white};
  border-radius: 12;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: ${deviceUtils.dimensions.height - 230};
  overflow: hidden;
  width: 100%;

  shadow-color: ${colors.dark};
  shadow-offset: 0px 10px;
  shadow-opacity: 0.7;
  shadow-radius: 50;
`;

const Modal = (props) => {
  return (
    <Container {...props} />
  );
}

// Modal.propTypes = {

// };

export default Modal;
