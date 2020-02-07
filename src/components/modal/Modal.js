import PropTypes from 'prop-types';
import React from 'react';
import { StatusBar } from 'react-native';
import styled from 'styled-components';
import { colors } from '../../styles';
import { deviceUtils } from '../../utils';
import { Centered, Column } from '../layout';
import TouchableBackdrop from '../TouchableBackdrop';

const ModalElement = styled(Column)`
  background-color: ${colors.white};
  border-radius: ${({ radius }) => radius || 12};
  flex-shrink: 0;
  height: ${({ height }) => height};
  width: 100%;
  margin-top: ${({ fixedToTop }) => (fixedToTop ? 91 : 0)};
`;

const Modal = ({
  height,
  onCloseModal,
  statusBarStyle,
  containerPadding,
  ...props
}) => (
  <Centered
    style={{ justifyContent: props.fixedToTop ? 'flex-start' : 'center' }}
    direction="column"
    height="100%"
    padding={containerPadding}
    width="100%"
  >
    <StatusBar barStyle={statusBarStyle} />
    <TouchableBackdrop onPress={onCloseModal} />
    <ModalElement {...props} height={height} />
  </Centered>
);

Modal.propTypes = {
  containerPadding: PropTypes.number.isRequired,
  fixedToTop: PropTypes.bool,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onCloseModal: PropTypes.func,
  statusBarStyle: PropTypes.oneOf(['default', 'light-content', 'dark-content']),
};

Modal.defaultProps = {
  containerPadding: 15,
  fixedToTop: false,
  height: deviceUtils.dimensions.height - 230,
  onCloseModal: () => null,
  statusBarStyle: 'light-content',
};

export default Modal;
