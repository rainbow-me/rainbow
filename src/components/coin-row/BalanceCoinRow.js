import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { View } from 'react-native';
import { compose, shouldUpdate, withHandlers } from 'recompact';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import {
  withAccountSettings,
  withOpenBalances,
  withEditOptions,
} from '../../hoc';
import { isNewValueForPath, deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { FlexItem, Row } from '../layout';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import CoinCheckButton from './CoinCheckButton';
import TransitionToggler from '../animations/TransitionToggler';
import withCoinListEdited from '../../hoc/withCoinListEdited';
import CoinRowInfo from './CoinRowInfo';

const BottomRow = ({ balance }) => {
  return (
    <Fragment>
      <BottomRowText>{balance.display}</BottomRowText>
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
  item,
  onPress,
  onPressSend,
  isCoinListEdited,
  nativeCurrencySymbol,
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
    <Row>
      <ButtonPressAnimation onPress={onPress} scaleTo={0.98}>
        <Row>
          <TransitionToggler
            startingWidth={0}
            endingWidth={42}
            toggle={isCoinListEdited}
          >
            <View style={{ width: deviceUtils.dimensions.width - 120 - 13 }}>
              <CoinRow
                onPress={onPress}
                onPressSend={onPressSend}
                {...item}
                {...props}
                bottomRowRender={BottomRow}
                topRowRender={TopRow}
              />
            </View>
          </TransitionToggler>
          <CoinRowInfo
            native={item.native}
            nativeCurrencySymbol={nativeCurrencySymbol}
          />
        </Row>
      </ButtonPressAnimation>
      {isCoinListEdited ? <CoinCheckButton isAbsolute {...item} /> : null}
    </Row>
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
