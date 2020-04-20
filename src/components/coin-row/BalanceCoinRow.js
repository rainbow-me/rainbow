import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { compose } from 'recompact';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import {
  withCoinListEdited,
  withOpenBalances,
  withEditOptions,
  withCoinRecentlyPinned,
} from '../../hoc';
import { isNewValueForPath, deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Column, FlexItem, Row } from '../layout';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import CoinCheckButton from './CoinCheckButton';
import CoinRowInfo from './CoinRowInfo';

const editTranslateOffset = 32;

const BottomRow = ({ balance }) => {
  return (
    <Fragment>
      <BottomRowText>{get(balance, 'display', '')}</BottomRowText>
    </Fragment>
  );
};

BottomRow.propTypes = {
  balance: PropTypes.shape({ display: PropTypes.string }),
};

const TopRow = ({ name }) => {
  return (
    <Row align="center" justify="space-between">
      <FlexItem flex={1}>
        <CoinName>{name}</CoinName>
      </FlexItem>
    </Row>
  );
};

TopRow.propTypes = {
  name: PropTypes.string,
};

const BalanceCoinRow = ({
  isFirstCoinRow,
  item,
  onPress,
  onPressSend,
  isCoinListEdited,
  pushSelectedCoin,
  removeSelectedCoin,
  recentlyPinnedCount,
  ...props
}) => {
  const [toggle, setToggle] = useState(false);
  const [previousPinned, setPreviousPinned] = useState(0);

  useEffect(() => {
    if (toggle && (recentlyPinnedCount > previousPinned || !isCoinListEdited)) {
      setPreviousPinned(recentlyPinnedCount);
      setToggle(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCoinListEdited, recentlyPinnedCount]);

  const handlePress = () => {
    if (toggle) {
      removeSelectedCoin(item.uniqueId);
    } else {
      pushSelectedCoin(item.uniqueId);
    }
    setToggle(!toggle);
  };

  const onPressHandler = useCallback(() => {
    onPress && onPress(item);
  }, [onPress, item]);

  const onPressSendHandler = useCallback(() => {
    onPressSend && onPressSend(item);
  }, [onPressSend, item]);

  return item.isSmall ? (
    <View width={deviceUtils.dimensions.width}>
      <ButtonPressAnimation
        onPress={isCoinListEdited ? handlePress : onPressHandler}
        scaleTo={0.96}
      >
        <Row>
          <View
            left={isCoinListEdited ? editTranslateOffset : 0}
            width={
              deviceUtils.dimensions.width -
              80 -
              (isCoinListEdited ? editTranslateOffset : 0)
            }
          >
            <CoinRow
              onPress={onPressHandler}
              onPressSend={onPressSendHandler}
              {...item}
              {...props}
              bottomRowRender={BottomRow}
              topRowRender={TopRow}
            />
          </View>
          <View position="absolute" right={3}>
            <CoinRowInfo isHidden={item.isHidden} native={item.native} />
          </View>
        </Row>
      </ButtonPressAnimation>
      {isCoinListEdited ? (
        <CoinCheckButton isAbsolute toggle={toggle} onPress={handlePress} />
      ) : null}
    </View>
  ) : (
    <Column flex={1} justify={isFirstCoinRow ? 'end' : 'start'}>
      <ButtonPressAnimation
        onPress={isCoinListEdited ? handlePress : onPressHandler}
        scaleTo={0.96}
      >
        <Row>
          <View
            left={isCoinListEdited ? editTranslateOffset : 0}
            width={
              deviceUtils.dimensions.width -
              80 -
              (isCoinListEdited ? editTranslateOffset : 0)
            }
          >
            <CoinRow
              onPress={onPressHandler}
              onPressSend={onPressSendHandler}
              {...item}
              {...props}
              bottomRowRender={BottomRow}
              topRowRender={TopRow}
            />
          </View>
          <View position="absolute" right={3}>
            <CoinRowInfo native={item.native} />
          </View>
        </Row>
      </ButtonPressAnimation>
      {isCoinListEdited ? (
        <CoinCheckButton isAbsolute toggle={toggle} onPress={handlePress} />
      ) : null}
    </Column>
  );
};

BalanceCoinRow.propTypes = {
  isFirstCoinRow: PropTypes.bool,
  item: PropTypes.object,
  onPress: PropTypes.func,
  onPressSend: PropTypes.func,
  openSmallBalances: PropTypes.bool,
};

const arePropsEqual = (props, nextProps) => {
  const isChangeInOpenAssets =
    props.openSmallBalances !== nextProps.openSmallBalances;
  const itemIdentifier = buildAssetUniqueIdentifier(props.item);
  const nextItemIdentifier = buildAssetUniqueIdentifier(nextProps.item);

  const isNewItem = itemIdentifier !== nextItemIdentifier;
  const isEdited = isNewValueForPath(props, nextProps, 'isCoinListEdited');
  const isPinned = isNewValueForPath(props, nextProps, 'item.isPinned');
  const isHidden = isNewValueForPath(props, nextProps, 'item.isHidden');
  const recentlyPinnedCount =
    isNewValueForPath(props, nextProps, 'recentlyPinnedCount') &&
    (get(props, 'item.isPinned', false) || get(props, 'item.isHidden', false));

  return !(
    isNewItem ||
    isChangeInOpenAssets ||
    isEdited ||
    isPinned ||
    isHidden ||
    recentlyPinnedCount
  );
};

export default React.memo(
  compose(
    withOpenBalances,
    withEditOptions,
    withCoinListEdited,
    withCoinRecentlyPinned
  )(BalanceCoinRow),
  arePropsEqual
);
