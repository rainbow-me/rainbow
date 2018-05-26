import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const colors = {
  accent: 'rgb(18, 184, 120)',
  contrast: 'rgb(255, 255, 255)',
};

const Label = styled.Text`
  color: ${props => (!props.outline ? colors.contrast : colors.accent)};
  font-weight: 700;
  align-self: center;
  padding: 10px;
`;

const ButtonContainer = styled.TouchableHighlight`
  background-color: ${props => (props.outline ? colors.contrast : colors.accent)};
  width: 80%;
  margin-top: 5px;
  border-color: ${colors.accent};
  border-width: 2px;
  border-radius: 10px;
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
