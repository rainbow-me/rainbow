import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const StyledCard = styled.View`
  width: 100%;
  background-color: white;
  margin: 14px;
  padding: 10px;
  border-radius: 8px;
  shadow-color: #000;
  shadow-offset: 0 2px;
  shadow-opacity: 0.1;
`;

const Card = ({ children, ...props }) => <StyledCard {...props}>{children}</StyledCard>;

Card.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Card;
