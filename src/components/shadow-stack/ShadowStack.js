import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import ShadowItem from './ShadowItem';

const ChildrenWrapper = styled.View`
  background-color: #ffffff;
  border-radius: ${({ borderRadius }) => borderRadius};
  bottom: 0;
  left: 0;
  overflow: hidden;
  position: absolute;
  right: 0;
  top: 0;
`;

const ShadowStackContainer = styled.View`
  border-radius: ${({ borderRadius }) => borderRadius};
  height: ${({ height }) => height};
  width: ${({ width }) => width};
  z-index: 1;
`;

const ShadowStack = ({ children, shadows, ...props }) => (
  <ShadowStackContainer {...props}>
    {shadows.map((shadow, index) => (
      <ShadowItem
        {...props}
        key={shadow}
        shadow={shadow}
        style={{ zIndex: index + 2 }}
      />
    ))}
    <ChildrenWrapper {...props} style={{ zIndex: shadows.length + 2 }}>
      {children}
    </ChildrenWrapper>
  </ShadowStackContainer>
);

ShadowStack.propTypes = {
  borderRadius: PropTypes.number,
  children: PropTypes.node,
  height: PropTypes.number,
  shadows: PropTypes.arrayOf(PropTypes.string),
  width: PropTypes.number,
};

export default ShadowStack;
