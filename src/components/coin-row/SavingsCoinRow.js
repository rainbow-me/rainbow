import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { FlexItem, Row, RowWithMargins } from '../layout';
import { Text } from '../text';
import BalanceText from './BalanceText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { APRPill } from '../savings';
import { convertAmountToBalanceDisplay } from '../../helpers/utilities';

const BottomRow = ({ lifetimeSupplyInterestAccrued, supplyRate, symbol }) => (
  <Fragment>
    <APRPill>{`${(parseFloat(supplyRate) * 100).toFixed(4)}% APR`}</APRPill>
    <RowWithMargins align="center" margin={4}>
      <Icon name="plusCircled" size={15} color={colors.green} />
      <Text color={colors.green} size="smedium" weight="semibold">
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

BottomRow.propTypes = {
  lifetimeSupplyInterestAccrued: PropTypes.string,
  supplyRate: PropTypes.string,
  symbol: PropTypes.string,
};

const TopRow = ({ name, supplyBalanceUnderlying, symbol }) => (
  <Row align="center" justify="space-between" marginBottom={3}>
    <FlexItem flex={1}>
      <CoinName letterSpacing="tight" weight="semibold">
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

const SavingsCoinRow = ({ item, onPress, onPressSend, ...props }) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={1.01}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
      onPress={onPress}
      onPressSend={onPressSend}
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

SavingsCoinRow.propTypes = {
  item: PropTypes.object,
  nativeCurrency: PropTypes.string,
  onPress: PropTypes.func,
  onPressSend: PropTypes.func,
  openSmallBalances: PropTypes.bool,
};

export default SavingsCoinRow;
