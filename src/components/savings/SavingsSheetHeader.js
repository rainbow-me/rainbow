import PropTypes from 'prop-types';
import React from 'react';
import { Centered, RowWithMargins } from '../layout';
import { DollarFigure, Text } from '../text';
import { colors, padding } from '@rainbow-me/styles';

const SavingsSheetHeader = ({ balance, lifetimeAccruedInterest }) => (
  <Centered css={padding(17, 0, 8)} direction="column">
    <Text
      color={colors.alpha(colors.blueGreyDark, 0.5)}
      letterSpacing="uppercase"
      size="smedium"
      uppercase
      weight="semibold"
    >
      Savings
    </Text>
    <DollarFigure decimals={2} value={balance} />
    <RowWithMargins align="center" margin={4} marginTop={1}>
      <Text
        align="center"
        color={colors.green}
        letterSpacing="roundedTight"
        lineHeight="loose"
        size="large"
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
