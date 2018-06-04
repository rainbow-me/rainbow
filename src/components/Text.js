import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const StyledText = styled.Text`
  color: #333333;
  margin-bottom: 6px;
  align-content: flex-end;
`;

const Text = ({ children, ...props }) => <StyledText {...props}>{children}</StyledText>;

Text.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Text;
