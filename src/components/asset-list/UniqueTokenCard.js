import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, position, shadow } from '../../styles';
import { Centered } from '../layout';
import { Monospace } from '../text';

const Container = styled(Centered)`
  ${position.size(161)}
  ${shadow.build(0, 3, 5)}
  ${shadow.build(0, 6, 10)}
  background-color: #EEE9E8;
  border-radius: 16;
`;

const Text = styled(Monospace)`
  color: ${colors.blueGreyDark};
`;

const UniqueTokenCard = ({ item, ...props }) => (
  <Container {...props}>
    <Text>{item.name}</Text>
  </Container>
);

UniqueTokenCard.propTypes = {
  item: PropTypes.string,
};

export default UniqueTokenCard;
