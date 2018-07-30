import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { padding, position, shadow } from '../../styles';
import { Centered } from '../layout';
import { Monospace } from '../text';
import { ShadowStack } from '../shadow-stack';

const Container = styled(Centered)`
  ${padding(10)}
  ${position.cover}
  background-color: ${({ background }) => (background || '#EEE9E8')};
  border-radius: 16;
`;

const Text = styled(Monospace).attrs({ color: 'blueGreyDark' })`
  line-height: 25;
  text-align: center;
`;

const UniqueTokenCard = ({
  item: {
    background,
    name,
    imageUrl,
    ...item,
  },
  ...props
}) => (
  console.log('CARD PROPS', item),
  <ShadowStack
    {...props}
    {...position.sizeAsObject(161)}
    borderRadius={16}
    shadows={[
      shadow.buildString(0, 3, 5, 'rgba(0,0,0,0.3)'),
      shadow.buildString(0, 6, 10, 'rgba(0,0,0,0.3)'),
    ]}
  >
    <Container background={background}>
      <Text>{name}</Text>
    </Container>
  </ShadowStack>
);

UniqueTokenCard.propTypes = {
  item: PropTypes.object,
};

export default UniqueTokenCard;
