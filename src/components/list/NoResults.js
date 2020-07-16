import React from 'react';
import styled from 'styled-components/primitives';
import { Centered, ColumnWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import { colors, position } from '@rainbow-me/styles';

const Container = styled(ColumnWithMargins).attrs({ margin: 3 })`
  ${position.centered};
`;

const NoResults = () => (
  <Container>
    <Centered>
      <Emoji lineHeight="none" name="ghost" size={42} />
    </Centered>
    <Text
      color={colors.alpha(colors.blueGreyDark, 0.4)}
      size="lmedium"
      weight="medium"
    >
      Nothing here!
    </Text>
  </Container>
);

const neverRerender = () => true;
export default React.memo(NoResults, neverRerender);
