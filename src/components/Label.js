import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const StyledLabel = styled.Text`
  font-weight: 600;
  margin-bottom: 6px;
`;

const Label = ({ children, ...props }) => <StyledLabel {...props}>{children}</StyledLabel>;

Label.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Label;
