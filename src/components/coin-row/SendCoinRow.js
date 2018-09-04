import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { Monospace } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const BottomRowText = styled(Monospace).attrs({ size: 'smedium' })`
  color: ${({ color }) => (color || colors.blueGreyLight)};
`;

const SendCoinRow = ({ item, ...props }) => (
  <CoinRow
    {...item}
    {...props}
    bottomRowRender={({ balance, native }) => (
      <Fragment>
        <BottomRowText>{balance.display} ≈ {get(native, 'balance.display')}</BottomRowText>
      </Fragment>
    )}
    topRowRender={({ name }) => (
      <Fragment>
        <CoinName>{name}</CoinName>
      </Fragment>
    )}
  />
);

SendCoinRow.propTypes = {
  item: PropTypes.object,
};

export default SendCoinRow;
