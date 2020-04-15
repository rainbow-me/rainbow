import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose } from 'recompact';
import styled from 'styled-components/primitives';
import { withCoinListEdited } from '../../hoc';
import { colors, padding } from '../../styles';
import { Row } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinRow from './CoinRow';

const CoinRowPaddingTop = 9;
const CoinRowPaddingBottom = 9;

const Container = styled(Row)`
  ${padding(CoinRowPaddingTop, 19, CoinRowPaddingBottom, 19)}
  width: 100%;
  flex-direction: column;
  align-items: flex-end;
  width: 130px;
  height: ${CoinRow.height};
  justify-content: space-between;
`;

const spaceNegativePercentage = percentString =>
  percentString ? percentString.split('-').join('- ') : null;

const CoinRowInfo = ({ isHidden, native }) => {
  const nativeDisplay = get(native, 'balance.display');

  const percentChange = get(native, 'change');
  const percentageChangeDisplay = spaceNegativePercentage(percentChange);
  const isPositive = percentChange && percentageChangeDisplay.charAt(0) !== '-';
  return (
    <Container style={{ height: 59, opacity: isHidden ? 0.4 : 1 }}>
      <BalanceText numberOfLines={1}>{nativeDisplay}</BalanceText>
      <BottomRowText
        align="right"
        color={isPositive ? colors.green : null}
        style={{ marginBottom: 0.5 }}
      >
        {percentageChangeDisplay}
      </BottomRowText>
    </Container>
  );
};

CoinRowInfo.propTypes = {
  isHidden: PropTypes.bool,
  native: PropTypes.object,
};

export default compose(withCoinListEdited)(CoinRowInfo);
