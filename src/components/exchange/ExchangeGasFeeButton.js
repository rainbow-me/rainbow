import { get, upperFirst } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {
  compose,
  pure,
  withHandlers,
  withProps,
} from 'recompact';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Nbsp } from '../html-entities';
import { Column, Row } from '../layout';
import { Emoji, Text } from '../text';

const Label = withProps({
  color: colors.alpha(colors.white, 0.4),
  size: 'smedium',
  weight: 'medium',
})(Text);

const Title = withProps({
  color: colors.white,
  letterSpacing: 'tight',
  size: 'lmedium',
  weight: 'semibold',
})(Text);

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

const ExchangeGasFeeButton = enhance(({
  gasPrice,
  nativeCurrencySymbol,
  onPress,
}) => (
  <ButtonPressAnimation onPress={onPress}>
    <Column css={padding(14, 19, 0)} width="100%">
      <Row align="center" justify="space-between">
        <Title>{get(gasPrice, 'txFee.native.value.display', `${nativeCurrencySymbol}0.00`)}</Title>
        <Row align="center" justify="end" height={26}>
          <Emoji
            letterSpacing="tight"
            name="stopwatch"
            size="lmedium"
          />
          <Nbsp />
          <Title>{upperFirst(get(gasPrice, 'option', 'average'))}</Title>
        </Row>
      </Row>
      <Row align="center" justify="space-between">
        <Label>Fee</Label>
        <Row align="center" justify="end">
          <Label>Swaps in ~</Label>
          <Label><Nbsp />{get(gasPrice, 'estimatedTime.display', '')}</Label>
        </Row>
      </Row>
    </Column>
  </ButtonPressAnimation>
));

ExchangeGasFeeButton.propTypes = {
  gasPrice: PropTypes.string,
  nativeCurrencySymbol: PropTypes.string,
  onPress: PropTypes.func,
};

export default ExchangeGasFeeButton;
