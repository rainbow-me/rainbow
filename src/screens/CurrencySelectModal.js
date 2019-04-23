import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import {
  InteractionManager, View, StyleSheet, Animated,
} from 'react-native';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
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




const BalancesRenderItem = ({
  index,
  item: { symbol, ...item },
  section: { onSelectAsset },
}) => (
  <SendCoinRow
    disabled
    {...item}
    onPress={onSelectAsset(symbol)}
    symbol={symbol}
  />
);


const SelectCurrencyModal = ({
  allAssets,
  currentSettingsPage,
  navigation,
  onCloseModal,
  onPressBack,
  onPressImportSeedPhrase,
  onPressSection,
  simultaniousRef,
  verticalRef,
  ...rest
}) => {
  const sections = [
    {
      balances: true,
      data: allAssets,
      onSelectAsset: () => null,
      renderItem: BalancesRenderItem,
    },
  ];


  return (
    <Modal overflow="hidden" containerPadding={0} minHeight={580} onCloseModal={onCloseModal}>
      <GestureBlocker type='top'/>
      <NavigationEvents
        // dangerouslyGetParent is a bad patter in general, but in this case is exactly what we expect
        onWillFocus={() => navigation.dangerouslyGetParent().setParams({ isGestureBlocked: true })}
        onWillBlur={() => navigation.dangerouslyGetParent().setParams({ isGestureBlocked: false })}
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
};

SelectCurrencyModal.propTypes = {
  navigation: PropTypes.object,
  onCloseModal: PropTypes.func,
  onPressBack: PropTypes.func,
  onPressImportSeedPhrase: PropTypes.func,
  onPressSection: PropTypes.func,
  verticalRef: PropTypes.any,
};

export default compose(
  withAccountAssets,
)(SelectCurrencyModal);
