import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { InteractionManager } from 'react-native';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
} from 'recompact';
import { withAccountSettings } from '../../hoc';
import { AssetPanel, AssetPanelAction, AssetPanelHeader } from './asset-panel';
import FloatingPanels from './FloatingPanels';

const TokenExpandedState = ({
  onPressSend,
  price,
  subtitle,
  title,
}) => (
  <FloatingPanels>
    <AssetPanel>
      <AssetPanelHeader
        price={price}
        subtitle={subtitle}
        title={title}
      />
      <AssetPanelAction
        icon="send"
        label="Send to..."
        onPress={onPressSend}
      />
    </AssetPanel>
  </FloatingPanels>
);

TokenExpandedState.propTypes = {
  onPressSend: PropTypes.func,
  price: PropTypes.string,
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

export default compose(
  withAccountSettings,
  withProps(({
    asset: { name, symbol, ...asset },
    nativeCurrencySymbol,
  }) => ({
    price: get(asset, 'native.price.display', `${nativeCurrencySymbol}0.00`),
    subtitle: get(asset, 'balance.display', symbol),
    title: name,
  })),
  withHandlers({
    onPressSend: ({ navigation, asset: { symbol } }) => () => {
      navigation.goBack();

      InteractionManager.runAfterInteractions(() => {
        navigation.navigate('SendSheet', { asset: symbol });
      });
    },
  }),
  onlyUpdateForKeys(['price']),
)(TokenExpandedState);
