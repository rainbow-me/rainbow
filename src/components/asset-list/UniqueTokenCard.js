import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, position, shadow } from '../../styles';
import { Centered } from '../layout';
import { Monospace } from '../text';
import { ShadowStack } from '../shadow-stack';

const Container = styled(Centered)`
  ${position.size(161)}
  background-color: #EEE9E8;
  border-radius: 16;
`;

const Text = styled(Monospace)`
  color: ${colors.blueGreyDark};
`;

const UniqueTokenCard = ({ item, ...props }) => (
  <ShadowStack
    {...position.sizeAsObject(161)}
    borderRadius={16}
    shadows={[
      shadow.buildString(0, 3, 5),
      shadow.buildString(0, 6, 10),
    ]}
  >
    <Container {...props}>
      <Text>{item.name}</Text>
    </Container>
  </ShadowStack>
);

UniqueTokenCard.propTypes = {
  item: PropTypes.object,
};

export default UniqueTokenCard;
