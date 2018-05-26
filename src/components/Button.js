import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const colors = {
  accent: 'rgb(18, 184, 120)',
  contrast: 'rgb(255, 255, 255)',
};

const Label = styled.Text`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.4px;
  align-self: center;
  padding: 0 0 10px 0;
`;

const ButtonContainer = styled.TouchableHighlight`
  position: absolute;
  bottom: 48px;
  background-color: #00B371;
  width: 347px;
  height: 59px;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
`;

const Button = props => (
  <ButtonContainer onPress={props.onPress} outline={props.outline}>
    <Label outline={props.outline}>{props.children}</Label>
  </ButtonContainer>
);

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onPress: PropTypes.func.isRequired,
  outline: PropTypes.bool,
};

Button.defaultProps = {
  outline: false,
};

export default Button;
