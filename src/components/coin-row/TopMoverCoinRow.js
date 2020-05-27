import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import styled, { css } from 'styled-components/primitives';
import { calculateAPY } from '../../helpers/savings';
import { convertAmountToBalanceDisplay } from '../../helpers/utilities';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Centered, ColumnWithMargins, FlexItem, Row, RowWithMargins } from '../layout';
import { APYPill } from '../savings';
import { Text } from '../text';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const TopMoverTitle = styled(CoinName).attrs({
  paddingRight: 0,
  weight: 'semibold',
})``;

const TopMoverCoinRow = ({ asset, onPress, ...props }) => {

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={1.02}>
      <RowWithMargins margin={8}>
        <Centered>
          <CoinIcon address={asset?.address} size={36} symbol={asset?.symbol} />
        </Centered>
        <RowWithMargins margin={12}>
          <ColumnWithMargins margin={2}>
            <TopMoverTitle>{asset?.name}</TopMoverTitle>
            <BottomRowText>{asset?.native?.change}</BottomRowText>
          </ColumnWithMargins>
          <ColumnWithMargins align="end" justify="end" margin={2}>
            <TopMoverTitle align="right">{asset?.native?.change}</TopMoverTitle>
            <BottomRowText align="right">{asset?.symbol}</BottomRowText>
          </ColumnWithMargins>
        </RowWithMargins>
      </RowWithMargins>
    </ButtonPressAnimation>
  );
};

TopMoverCoinRow.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
};

export default TopMoverCoinRow;
