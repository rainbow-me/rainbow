import PropTypes from 'prop-types';
import React, { Component, createElement } from 'react';
import { nest } from 'recompact';
import styled from 'styled-components/primitives';
import { colors } from '../styles';

const Shadow = styled.View`
  background-color: ${({ shadowColor }) => (shadowColor || colors.white)};
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => boxShadow};
  height: ${({ height }) => height};
  width: ${({ width }) => width};
`;

const ShadowItem = ({ boxShadow, ...props }) => {
  const shadowParts = boxShadow.split(' ');
  const shadowColor = shadowParts.slice(3).join('');
  return (
    <Shadow
      {...props}
      boxShadow={boxShadow}
      shadowColor={shadowColor}
    />
  );
};

ShadowItem.propTypes = {
  borderRadius: PropTypes.number,
  boxShadow: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
};

export default class ShadowStack extends Component {
  static propTypes = {
    shadows: PropTypes.arrayOf(PropTypes.string),
  }

  constructor(props) {
    super(props);
    this.buildNestedStack();
  }

  componentDidUpdate = prevProps => {
    if (this.props.shadows !== prevProps.shadows) {
      this.buildNestedStack();
    }
  }

  nestedStack = null

  buildNestedStack = () => {
    this.nestedStack = nest(...this.buildShadows());
  }

  buildShadows = () => {
    const { shadows, ...props } = this.props;
    return shadows.map((boxShadow, index) => nestedProps => (
      <ShadowItem
        {...props}
        {...nestedProps}
        boxShadow={boxShadow}
        index={index}
        key={boxShadow}
      />
    ));
  }

  render = () => createElement(this.nestedStack, this.props)
}
