import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { calculateAPY } from '../../helpers/savings';
import { convertAmountToBalanceDisplay } from '../../helpers/utilities';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { FlexItem, Row, RowWithMargins } from '../layout';
import { APYPill } from '../savings';
import { Text } from '../text';
import BalanceText from './BalanceText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const BottomRow = ({ lifetimeSupplyInterestAccrued, supplyRate, symbol }) => {
  const apy = calculateAPY(supplyRate);
  const apyTruncated = parseFloat(apy).toFixed(2);

  return (
    <Fragment>
      <APYPill small value={apyTruncated} />
      <RowWithMargins align="center" margin={4}>
        <Text
          align="right"
          color={colors.green}
          size="smedium"
          weight="semibold"
        >
          {'􀁍 '}
          {convertAmountToBalanceDisplay(
            lifetimeSupplyInterestAccrued,
            {
              symbol,
            },
            1
          )}
        </Text>
      </RowWithMargins>
    </Fragment>
  );
};

BottomRow.propTypes = {
  lifetimeSupplyInterestAccrued: PropTypes.string,
  supplyRate: PropTypes.string,
  symbol: PropTypes.string,
};

const TopRow = ({ name, supplyBalanceUnderlying, symbol }) => (
  <Row align="center" justify="space-between" marginBottom={2}>
    <FlexItem flex={1}>
      <CoinName letterSpacing="roundedMedium" weight="semibold">
        {name}
      </CoinName>
    </FlexItem>
    <FlexItem flex={0}>
      <BalanceText>
        {convertAmountToBalanceDisplay(supplyBalanceUnderlying, { symbol })}
      </BalanceText>
    </FlexItem>
  </Row>
);

TopRow.propTypes = {
  name: PropTypes.string,
  supplyBalanceUnderlying: PropTypes.string,
  symbol: PropTypes.string,
};

const SavingsCoinRow = ({ item, onPress, ...props }) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={1.02}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
      onPress={onPress}
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

SavingsCoinRow.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
};

export default SavingsCoinRow;
