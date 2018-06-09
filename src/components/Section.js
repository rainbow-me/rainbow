import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const StyledSection = styled.View`
  width: 100%;
  display: flex;
  margin-bottom: 6px;
`;

const Section = ({ children, ...props }) => <StyledSection {...props}>{children}</StyledSection>;

Section.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Section;
