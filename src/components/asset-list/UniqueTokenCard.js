import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import { Centered } from '../layout';
import { Monospace } from '../text';

const Container = styled(Centered)`
  ${position.size(161)}
  background-color: #EEE9E8;
  border-radius: 16;
  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.04);
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.04);
`;

const Text = styled(Monospace)`
  color: ${colors.blueGreyDark};
`;

const UniqueTokenCard = ({ item, ...props }) => (
  <Container {...props}>
    <Text>{item}</Text>
  </Container>
);

UniqueTokenCard.propTypes = {
  item: PropTypes.string,
};

export default UniqueTokenCard;
