import PropTypes from 'prop-types';
import React from 'react';
import { colors, padding } from '../../styles';
import { Centered, RowWithMargins } from '../layout';
import { DollarFigure, Text } from '../text';

const SavingsSheetHeader = ({ balance, lifetimeAccruedInterest }) => (
  <Centered css={padding(9, 0, 3)} direction="column">
    <Text
      color={colors.alpha(colors.blueGreyDark, 0.5)}
      letterSpacing="uppercase"
      size="smedium"
      uppercase
      weight="semibold"
    >
      Savings
    </Text>
    <DollarFigure value={balance} decimals={2} />
    <RowWithMargins align="center" margin={4} marginTop={1}>
      <Text
        align="center"
        color={colors.green}
        letterSpacing="roundedTight"
        size="large"
        lineHeight="loose"
        weight="semibold"
      >
        􀁍 {lifetimeAccruedInterest}
      </Text>
    </RowWithMargins>
  </Centered>
);

SavingsSheetHeader.propTypes = {
  balance: PropTypes.string,
  lifetimeAccruedInterest: PropTypes.string,
};

export default SavingsSheetHeader;
