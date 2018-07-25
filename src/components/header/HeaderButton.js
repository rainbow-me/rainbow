import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../buttons';
import { padding } from '../../styles';

const Container = styled.View`
  ${padding(10)}
`;

const HeaderButton = ({ children, onPress, ...props }) => (
  <ButtonPressAnimation onPress={onPress}>
    <Container {...props}>
      {children}
    </Container>
  </ButtonPressAnimation>
);

HeaderButton.propTypes = {
  children: PropTypes.node,
  onPress: PropTypes.func.isRequired,
};

export default HeaderButton;
