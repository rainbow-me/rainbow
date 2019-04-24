import PropTypes from 'prop-types';
import React from 'react';
import { compose } from 'recompact';
import { withAccountAssets } from '@rainbow-me/rainbow-common';
import { NavigationEvents } from 'react-navigation';
import { Column, FlexItem } from '../components/layout';
import { Modal } from '../components/modal';
import AssetList from '../components/asset-list/RecyclerAssetList';
import { SendCoinRow } from '../components/coin-row';
import GestureBlocker from '../components/GestureBlocker';
import { Monospace } from '../components/text';
import { colors } from '../styles';
import StarIcon from '../components/icons/svg/StarIcon';


const BottomRow = ({ balance, symbol }) => (
  <Monospace
    color={colors.alpha(colors.blueGreyDark, 0.6)}
    size="smedium"
  >
    {symbol}
  </Monospace>
);

BottomRow.propTypes = {
  balance: PropTypes.shape({ display: PropTypes.string }),
  symbol: PropTypes.string,
};


const StarRender = ({ favorite }) => (
  <FlexItem flex={0} style={{ marginLeft: 8 }}>
    <StarIcon
      color={favorite ? colors.orangeLight : colors.grey}
    />
  </FlexItem>
);

StarRender.propTypes = {
  favorite: PropTypes.bool,
};

const CurrencyRenderItem = ({
  index,
  item: { symbol, ...item },
  section: { onSelectAsset },
}) => (
  <SendCoinRow
    {...item}
    onPress={onSelectAsset(symbol)}
    symbol={symbol}
    starRender={StarRender}
    bottomRowRender={BottomRow}
  />
);


CurrencyRenderItem.propTypes = {
  index: PropTypes.number,
  item: PropTypes.shape({ symbol: PropTypes.string }),
  section: PropTypes.shape({ onSelectAsset: PropTypes.func }),
};

class SelectCurrencyModal extends React.Component {
  render() {
    const {
      allAssets,
      navigation,
    } = this.props;
    const sections = [
      {
        balances: true,
        data: allAssets,
        onSelectAsset: (symbol) => () => {
          // It's a bit weird and I'm not sure why on invoking
          // navigation.getParam('setSelectedCurrency')(symbol)
          // but this small hack seems to be a legit workaround
          this.callback(symbol);
          navigation.navigate('MainExchangeScreen');
        },
        renderItem: CurrencyRenderItem,
      },
    ];

    const currentCallback = navigation.getParam('setSelectedCurrency');
    if (currentCallback) {
      this.callback = currentCallback;
    }

    return (
      <Modal overflow="hidden" containerPadding={4} minHeight={580}>
        <GestureBlocker type='top'/>
        <NavigationEvents
          // dangerouslyGetParent is a bad patter in general, but in this case is exactly what we expect
          onWillFocus={() => navigation.dangerouslyGetParent()
            .setParams({ isGestureBlocked: true })}
          onWillBlur={() => navigation.dangerouslyGetParent()
            .setParams({ isGestureBlocked: false })}
        />
        <Column flex={1}>
          <AssetList
            hideHeader
            sections={sections}
          />
        </Column>
        <GestureBlocker type='bottom'/>
      </Modal>
    );
  }
}


SelectCurrencyModal.propTypes = {
  allAssets: PropTypes.array,
  navigation: PropTypes.object,
};

export default compose(
  withAccountAssets,
)(SelectCurrencyModal);
