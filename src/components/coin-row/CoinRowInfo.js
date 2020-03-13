import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { Row } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinRow from './CoinRow';
import { compose } from 'recompact';
import { withAccountSettings } from '../../hoc';

const CoinRowPaddingTop = 15;
const CoinRowPaddingBottom = 7;

const Container = styled(Row)`
  ${padding(CoinRowPaddingTop, 19, CoinRowPaddingBottom, 19)}
  width: 100%;
  flex-direction: column;
  align-items: flex-end;
  width: 130px;
  height: ${CoinRow.height};
  justify-content: space-between;
`;

const formatPercentageString = percentString =>
  percentString
    ? percentString
        .split('-')
        .join('- ')
        .split('%')
        .join(' %')
    : '-';

const CoinRowInfo = ({ native, nativeCurrencySymbol }) => {
  const nativeDisplay = get(native, 'balance.display');

  const percentChange = get(native, 'change');
  const percentageChangeDisplay = formatPercentageString(percentChange);
  const isPositive = percentChange && percentageChangeDisplay.charAt(0) !== '-';
  return (
    <Container>
      <BalanceText
        color={nativeDisplay ? null : colors.blueGreyLight}
        numberOfLines={1}
      >
        {nativeDisplay || `${nativeCurrencySymbol}0.00`}
      </BalanceText>
      <BottomRowText color={isPositive ? colors.limeGreen : null}>
        {percentageChangeDisplay}
      </BottomRowText>
    </Container>
  );
};

CoinRowInfo.propTypes = {
  native: PropTypes.object,
  nativeCurrencySymbol: PropTypes.string,
};

export default compose(withAccountSettings)(CoinRowInfo);
