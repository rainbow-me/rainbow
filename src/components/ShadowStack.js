import PropTypes from 'prop-types';
import React, { cloneElement, createElement } from 'react';
import { View } from 'react-native';
import { compose, nest, toClass, renderComponent, withProps } from 'recompose';
// import { View } from 'react-primitives';
import styled from 'styled-components/primitives';
import { Row } from './layout';
import { borders, colors, shadow } from '../styles';

const Container = styled(Row)`
  background-color: ${colors.white};
  flex-shrink: 0;
  height: 2;
  width: 100%;
`;


const ShadowItem = styled.View`
  background-color: ${({ shadowColor }) => shadowColor};
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow, ...rest }) => {
    console.log('boxShadow', boxShadow);
    console.log('REST', rest);

    return boxShadow;
  }};
  height: ${({ height }) => height};
  width: ${({ width }) => width};
`;

const Shadow = ({
  boxShadow,
  ...props
}) => {
  const shadowParts = boxShadow.split(' ');
  const shadowColor = shadowParts.slice(3).join('');

  console.log('SHADOW COLOR', boxShadow);

  console.log('boxShadow', boxShadow);

  return (
    <ShadowItem
      {...props}
      boxShadow={boxShadow}
      shadowColor={shadowColor}
    />
  );
};

Shadow.propTypes = {
  borderRadius: PropTypes.number,
  boxShadow: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
};

const enhance = compose(
  withProps(({ shadows, ...props }) => ({
    stack: shadows.map((boxShadow, index) => () => (
      <Shadow
        {...props}
        boxShadow={boxShadow}
        index={index}
        key={boxShadow}
      />
    )),
  })),
  withProps(({ stack }) => ({ stack: nest(...stack) })),
);

// children, /

const ShadowStack = enhance(({ children, stack, ...props }) => {
  return createElement(stack, {
    ...props,
    children,
  });
});

export default ShadowStack;
