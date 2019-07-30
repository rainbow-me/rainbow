import React from 'react';
import PropTypes from 'prop-types';
import { compose, pure, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding, shadow } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';

const Container = styled(RowWithMargins)`
  ${padding(5.5, 10)};
  ${shadow.build(0, 0, 1, colors.dark, 1)};
  border-color: ${colors.alpha(colors.white, 0.15)};
  border-radius: 16;
  border-width: 1.75;
`;

const enhance = compose(
  pure,
  withHandlers({
    onPress: ({ onPress }) => (event) => {
      if (onPress) {
        onPress(event);
      }
    },
  }),
);

const ExchangeGasFeeButton = enhance(({ gasPrice, onPress }) => (
  <ButtonPressAnimation onPress={onPress}>
    <Container align="center" margin={5} self="center">
      <Emoji
        name="fuelpump"
        size="small"
      />
      <Text
        color={colors.alpha(colors.white, 0.8)}
        lineHeight="tight"
        marginBottom={1}
        size="medium"
        weight="medium"
      >
        {`Fee: ${gasPrice}`}
      </Text>
    </Container>
  </ButtonPressAnimation>
));

ExchangeGasFeeButton.propTypes = {
  gasPrice: PropTypes.string,
  onPress: PropTypes.func,
};

export default ExchangeGasFeeButton;
