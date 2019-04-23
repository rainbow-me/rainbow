import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import {
  InteractionManager, View, StyleSheet, Animated,
} from 'react-native';
import {
  compose,
  onlyUpdateForKeys, pure,
  withHandlers,
  withProps, withState,
} from 'recompact';
import { ScrollView } from 'react-native-gesture-handler';
import lang from 'i18n-js';
import { Column } from '../components/layout';
import { Modal, ModalHeader } from '../components/modal';
import { AnimatedPager } from '../components/pager';
import {
  BackupSection,
  CurrencySection,
  LanguageSection,
  NetworkSection,
  SettingsSection,
} from '../components/settings-menu';
import { deviceUtils } from '../utils';
import { FlyInAnimation } from '../components/animations';
import AssetList from '../components/asset-list/RecyclerAssetList';
import { SendCoinRow } from '../components/coin-row';
import GestureBlocker from '../components/GestureBlocker';
import { withAccountAssets } from '@rainbow-me/rainbow-common';
import { NavigationEvents } from "react-navigation";
import store from '../redux/store';
import { disableGestureForModal, updateTransitionProps } from '../redux/navigation';
import { Monospace } from '../components/text';
import { colors } from '../styles';


const BottomRow = ({ balance, symbol }) => {
  return (
    <Monospace
      color={colors.alpha(colors.blueGreyDark, 0.6)}
      size="smedium"
    >
      {symbol}
    </Monospace>
  );
};

BottomRow.propTypes = {
  balance: PropTypes.shape({ display: PropTypes.string }),
  native: PropTypes.object,
  nativeCurrencySymbol: PropTypes.string,
};



const CurrencyRenderItem = ({
  index,
  item: { symbol, ...item },
  section: { onSelectAsset },
}) => (
  <SendCoinRow
    disabled
    {...item}
    onPress={onSelectAsset(symbol)}
    symbol={symbol}
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
      currentSettingsPage,
      navigation,
      onCloseModal,
    } = this.props
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
      <Modal overflow="hidden" containerPadding={0} minHeight={580} onCloseModal={onCloseModal}>
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
  callback: PropTypes.func,
  navigation: PropTypes.object,
  onCloseModal: PropTypes.func,
  onPressBack: PropTypes.func,
  onPressImportSeedPhrase: PropTypes.func,
  onPressSection: PropTypes.func,
  setCallback: PropTypes.func,
  verticalRef: PropTypes.any,
};

export default compose(
  withAccountAssets,
  withState('callback', 'setCallback', null),
)(SelectCurrencyModal);
