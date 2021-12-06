import React, { Fragment } from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { calculateAPY } from '../../helpers/savings';
import { convertAmountToBalanceDisplay } from '../../helpers/utilities';
import { ButtonPressAnimation } from '../animations';
import { Column, FlexItem, Row, RowWithMargins } from '../layout';
import { APYPill } from '../savings';
import { Text } from '../text';
import BalanceText from './BalanceText';
import CoinName from './CoinName';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRow' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import CoinRow from './CoinRow';

export const SavingsCoinRowHeight = 64;

const BottomRow = ({
  lifetimeSupplyInterestAccrued,
  supplyRate,
  symbol,
}: any) => {
  const apy = calculateAPY(supplyRate);
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | number' is not assignab... Remove this comment to see the full error message
  const apyTruncated = parseFloat(apy).toFixed(2);
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <APYPill small value={apyTruncated} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <RowWithMargins flex={1} margin={4}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Column flex={1}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Text
            align="right"
            color={colors.green}
            flex={1}
            size="smedium"
            weight="semibold"
          >
            {'􀁍 '}
            {convertAmountToBalanceDisplay(
              lifetimeSupplyInterestAccrued,
              {
                // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ symbol: any; }' is not assigna... Remove this comment to see the full error message
                symbol,
              },
              1
            )}
          </Text>
        </Column>
      </RowWithMargins>
    </Fragment>
  );
};

const TopRow = ({ name, supplyBalanceUnderlying, symbol }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Row align="center" justify="space-between" marginBottom={2}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FlexItem flex={1}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CoinName letterSpacing="roundedMedium" weight="semibold">
        {name}
      </CoinName>
    </FlexItem>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <BalanceText>
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ symbol: any; }' is not assigna... Remove this comment to see the full error message
      {convertAmountToBalanceDisplay(supplyBalanceUnderlying, { symbol })}
    </BalanceText>
  </Row>
);

const SavingsCoinRow = ({ item, onPress, ...props }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <ButtonPressAnimation disabled onPress={onPress} scaleTo={1.02}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      {...(android && { contentStyles: { height: 50 } })}
      onPress={onPress}
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

export default SavingsCoinRow;
