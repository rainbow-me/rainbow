import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { colors } from '../styles';

const StyledContainer = styled.View`
  flex: 1;
  justify-content: flex-start;
  align-items: flex-start;
  background-color: ${colors.white};
  padding: 00px;
`;

const Container = ({ children, ...props }) => <StyledContainer {...props}>{children}</StyledContainer>;

Container.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Container;
