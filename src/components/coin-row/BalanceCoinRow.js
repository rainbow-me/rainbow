import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { compose, shouldUpdate, withHandlers } from 'recompact';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import {
  withAccountSettings,
  withOpenBalances,
  withEditOptions,
} from '../../hoc';
import { colors } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { FlexItem, Row } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import CoinCheckButton from './CoinCheckButton';
import TransitionToggler from '../animations/TransitionToggler';
import withCoinListEdited from '../../hoc/withCoinListEdited';

const formatPercentageString = percentString =>
  percentString
    ? percentString
        .split('-')
        .join('- ')
        .split('%')
        .join(' %')
    : '-';

const BottomRow = ({ balance, native }) => {
  const percentChange = get(native, 'change');
  const percentageChangeDisplay = formatPercentageString(percentChange);
  const isPositive = percentChange && percentageChangeDisplay.charAt(0) !== '-';

  return (
    <Fragment>
      <BottomRowText>{balance.display}</BottomRowText>
      <BottomRowText color={isPositive ? colors.limeGreen : null}>
        {percentageChangeDisplay}
      </BottomRowText>
    </Fragment>
  );
};

BottomRow.propTypes = {
  balance: PropTypes.shape({ display: PropTypes.string }),
  native: PropTypes.object,
};

const TopRow = ({ name, native, nativeCurrencySymbol }) => {
  const nativeDisplay = get(native, 'balance.display');

  return (
    <Row align="center" justify="space-between">
      <FlexItem flex={1}>
        <CoinName>{name}</CoinName>
      </FlexItem>
      <FlexItem flex={0}>
        <BalanceText color={nativeDisplay ? null : colors.blueGreyLight}>
          {nativeDisplay || `${nativeCurrencySymbol}0.00`}
        </BalanceText>
      </FlexItem>
    </Row>
  );
};

TopRow.propTypes = {
  name: PropTypes.string,
  native: PropTypes.object,
  nativeCurrencySymbol: PropTypes.string,
};

const BalanceCoinRow = ({
  item,
  onPress,
  onPressSend,
  isCoinListEdited,
  ...props
}) => {
  return item.isSmall ? (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.98}>
      <CoinRow
        onPress={onPress}
        onPressSend={onPressSend}
        {...item}
        {...props}
        bottomRowRender={BottomRow}
        topRowRender={TopRow}
      />
    </ButtonPressAnimation>
  ) : (
    <>
      <CoinCheckButton isAbsolute {...item} />
      <TransitionToggler
        startingWidth={0}
        endingWidth={42}
        toggle={isCoinListEdited}
      >
        <ButtonPressAnimation onPress={onPress} scaleTo={0.98}>
          <CoinRow
            onPress={onPress}
            onPressSend={onPressSend}
            {...item}
            {...props}
            bottomRowRender={BottomRow}
            topRowRender={TopRow}
          />
        </ButtonPressAnimation>
      </TransitionToggler>
    </>
  );
};

BalanceCoinRow.propTypes = {
  item: PropTypes.object,
  nativeCurrency: PropTypes.string.isRequired,
  onPress: PropTypes.func,
  onPressSend: PropTypes.func,
  openSmallBalances: PropTypes.bool,
};

export default compose(
  withAccountSettings,
  withOpenBalances,
  withEditOptions,
  withCoinListEdited,
  withHandlers({
    onPress: ({ item, onPress }) => () => {
      if (onPress) {
        onPress(item);
      }
    },
    onPressSend: ({ item, onPressSend }) => () => {
      if (onPressSend) {
        onPressSend(item);
      }
    },
  }),
  shouldUpdate((props, nextProps) => {
    const isChangeInOpenAssets =
      props.openSmallBalances !== nextProps.openSmallBalances;
    const itemIdentifier = buildAssetUniqueIdentifier(props.item);
    const nextItemIdentifier = buildAssetUniqueIdentifier(nextProps.item);

    const isNewItem = itemIdentifier !== nextItemIdentifier;
    const isNewNativeCurrency = isNewValueForPath(
      props,
      nextProps,
      'nativeCurrency'
    );
    const isEdited = isNewValueForPath(props, nextProps, 'isCoinListEdited');
    const isPinned = isNewValueForPath(props, nextProps, 'item.isPinned');
    const isHidden = isNewValueForPath(props, nextProps, 'item.isHidden');

    return (
      isNewItem ||
      isNewNativeCurrency ||
      isChangeInOpenAssets ||
      isEdited ||
      isPinned ||
      isHidden
    );
  })
)(BalanceCoinRow);
