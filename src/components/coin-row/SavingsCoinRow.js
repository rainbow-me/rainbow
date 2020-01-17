import { get } from 'lodash'
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { colors, padding } from '../../styles';
import { isNewValueForObjectPaths } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, FlexItem, Row, RowWithMargins } from '../layout';
import { Text } from '../text';
import BalanceText from './BalanceText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { APRPill } from '../savings';

const BottomRow = ({ balance, native }) => {
  return (
    <Fragment>
      <APRPill>6.82% APR</APRPill>
      <RowWithMargins align="center" margin={4}>
        <Icon name="plusCircled" size={15} />
        <Text color={colors.limeGreen} size="smedium" weight="semibold">
          20.59 USDC
        </Text>
      </RowWithMargins>
    </Fragment>
  );
};

BottomRow.propTypes = {
  balance: PropTypes.shape({ display: PropTypes.string }),
  native: PropTypes.object,
};

const TopRow = ({ balance, name }) => (
  <Row align="center" justify="space-between" marginBottom={3}>
    <FlexItem flex={1}>
      <CoinName letterSpacing="tight" weight="semibold">
        {name}
      </CoinName>
    </FlexItem>
    <FlexItem flex={0}>
      <BalanceText>{get(balance, 'display', '_')}</BalanceText>
    </FlexItem>
  </Row>
);

TopRow.propTypes = {
  balance: PropTypes.shape({ display: PropTypes.string }),
  name: PropTypes.string,
};

const SavingsCoinRow = ({ item, onPress, onPressSend, ...props }) => (
    <CoinRow
      {...item}
      {...props}
      onPress={onPress}
      onPressSend={onPressSend}
      bottomRowRender={BottomRow}
      topRowRender={TopRow}
    />
);



  // <ButtonPressAnimation onPress={onPress} scaleTo={0.98}>
  // </ButtonPressAnimation>

SavingsCoinRow.propTypes = {
  item: PropTypes.object,
  nativeCurrency: PropTypes.string.isRequired,
  onPress: PropTypes.func,
  onPressSend: PropTypes.func,
  openSmallBalances: PropTypes.bool,
};

export default SavingsCoinRow;
