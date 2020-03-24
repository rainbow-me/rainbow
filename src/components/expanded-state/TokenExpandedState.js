import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import { useAccountAssets } from '../../hooks';
import { ethereumUtils } from '../../utils';
import { AssetPanel, AssetPanelAction, AssetPanelHeader } from './asset-panel';
import FloatingPanels from './FloatingPanels';

const TokenExpandedState = ({
  onPressSend,
  asset: { address, name, symbol },
}) => {
  const { assets } = useAccountAssets();
  const selectedAsset = ethereumUtils.getAsset(assets, address);
  const price = get(selectedAsset, 'native.price.display', null);
  const subtitle = get(selectedAsset, 'balance.display', symbol);
  return (
    <FloatingPanels width={100}>
      <AssetPanel>
        <AssetPanelHeader price={price} subtitle={subtitle} title={name} />
        <AssetPanelAction
          icon="send"
          label="Send to..."
          onPress={onPressSend}
        />
      </AssetPanel>
    </FloatingPanels>
  );
};

TokenExpandedState.propTypes = {
  asset: PropTypes.object,
  onPressSend: PropTypes.func,
};

export default compose(
  withHandlers({
    onPressSend: ({ navigation, asset }) => () => {
      navigation.navigate('SendSheet', { asset });
    },
  }),
  onlyUpdateForKeys(['price', 'subtitle'])
)(TokenExpandedState);
