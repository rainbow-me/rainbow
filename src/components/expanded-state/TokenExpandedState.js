import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { InteractionManager } from 'react-native';
import Piwik from 'react-native-matomo';
import { compose, withHandlers, withProps } from 'recompact';
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
  withProps(({ asset: { name, symbol, ...asset } }) => ({
    price: get(asset, 'native.price.display', '$0.00'),
    subtitle: get(asset, 'balance.display', symbol),
    title: name,
  })),
  withHandlers({
    onPressSend: ({ navigation, asset: { symbol } }) => () => {
      navigation.goBack();

      InteractionManager.runAfterInteractions(() => {
        Piwik.trackEvent('Navigation', 'send-expanded');
        navigation.navigate('SendScreen', { asset: symbol });
      });
    },
  }),
)(TokenExpandedState);
