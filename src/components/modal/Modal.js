import PropTypes from 'prop-types';
import React from 'react';
import { StatusBar, View } from 'react-native';
import styled from 'styled-components';
import { colors, padding } from '../../styles';
import { deviceUtils } from '../../utils';
import { Centered, Column } from '../layout';
import TouchableBackdrop from '../TouchableBackdrop';

const Container = styled(Centered)`
  height: 100%;
`;

const ModalElement = styled(Column)`
  background-color: ${colors.white};
  border-radius: 12;
  flex-shrink: 0;
  height: ${({ height }) => height};
  shadow-color: ${colors.dark};
  shadow-offset: 0px 10px;
  shadow-opacity: 0.6;
  shadow-radius: 50;
  width: 100%;
`;

const Modal = ({
  height,
  onCloseModal,
  statusBarStyle,
  containerPadding,
  ...props
}) => (
  <Container padding={containerPadding} direction="column">
    <StatusBar barStyle={statusBarStyle} />
    <TouchableBackdrop onPress={onCloseModal} />
    <ModalElement
      {...props}
      height={height}
    />
  </Container>
);

Modal.propTypes = {
  containerPadding: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  onCloseModal: PropTypes.func,
  statusBarStyle: PropTypes.oneOf(['default', 'light-content', 'dark-content']),
};

Modal.defaultProps = {
  containerPadding: 15,
  height: deviceUtils.dimensions.height - 230,
  onCloseModal: () => null,
  statusBarStyle: 'light-content',
};

export default Modal;
