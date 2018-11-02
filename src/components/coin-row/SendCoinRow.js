import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../buttons';
import { Monospace } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const BottomRowText = styled(Monospace).attrs({ size: 'smedium' })`
  color: ${({ color }) => (color || colors.blueGreyLight)};
`;

const SendCoinRow = ({ item, onPress, ...props }) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={({ balance, native }) => (
        <Fragment>
          <BottomRowText>{get(balance, 'display')} ≈ {get(native, 'balance.display') || '$0.00'}</BottomRowText>
        </Fragment>
      )}
      topRowRender={({ name }) => (
        <Fragment>
          <CoinName>{name}</CoinName>
        </Fragment>
      )}
    />
  </ButtonPressAnimation>
);

SendCoinRow.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
};

export default SendCoinRow;
