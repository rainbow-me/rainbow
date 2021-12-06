import PropTypes from 'prop-types';
import React from 'react';
import { Centered, RowWithMargins } from '../layout';
import { DollarFigure, Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const SavingsSheetHeader = ({ balance, lifetimeAccruedInterest }: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered css={padding(17, 0, 8)} direction="column">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text
        color={colors.alpha(colors.blueGreyDark, 0.5)}
        letterSpacing="uppercase"
        size="smedium"
        uppercase
        weight="semibold"
      >
        Savings
      </Text>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <DollarFigure decimals={2} value={balance} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <RowWithMargins align="center" margin={4} marginTop={1}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text
          align="center"
          color={colors.green}
          lineHeight="loose"
          size="large"
          weight="bold"
        >
          Earned {lifetimeAccruedInterest}
        </Text>
      </RowWithMargins>
    </Centered>
  );
};

SavingsSheetHeader.propTypes = {
  balance: PropTypes.string,
  lifetimeAccruedInterest: PropTypes.string,
};

export default SavingsSheetHeader;
