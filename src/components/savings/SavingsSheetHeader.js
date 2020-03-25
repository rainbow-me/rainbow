import PropTypes from 'prop-types';
import React from 'react';
import { colors, padding } from '../../styles';
import { Icon } from '../icons';
import { Centered, RowWithMargins } from '../layout';
import { DollarFigure, Rounded } from '../text';
import { formatSavingsAmount } from '../../helpers/savings';

const SavingsSheetHeader = ({ balance, lifetimeAccruedInterest }) => (
  <Centered css={padding(9, 0, 3)} direction="column">
    <Rounded
      color={colors.alpha(colors.blueGreyDark, 0.5)}
      letterSpacing="tooLoose"
      size="smedium"
      uppercase
      weight="semibold"
    >
      Savings
    </Rounded>
    <DollarFigure value={balance} decimals={2} />
    <RowWithMargins align="center" margin={5} marginTop={1}>
      <Icon name="plusCircled" color={colors.green} />
      <Rounded
        color={colors.green}
        letterSpacing="looser"
        size="large"
        lineHeight="loose"
        weight="bold"
      >
        {formatSavingsAmount(lifetimeAccruedInterest)}
      </Rounded>
    </RowWithMargins>
  </Centered>
);

SavingsSheetHeader.propTypes = {
  balance: PropTypes.string,
  lifetimeAccruedInterest: PropTypes.string,
};

export default SavingsSheetHeader;
