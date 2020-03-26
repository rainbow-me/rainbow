import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { useAccountAssets } from '../../hooks';
import { ethereumUtils } from '../../utils';
import { AssetPanel, AssetPanelAction, AssetPanelHeader } from './asset-panel';
import FloatingPanels from './FloatingPanels';

const TokenExpandedState = ({ asset, navigation }) => {
  const { address, name, symbol } = asset;
  const { assets } = useAccountAssets();
  const selectedAsset = ethereumUtils.getAsset(assets, address);
  const price = get(selectedAsset, 'native.price.display', null);
  const subtitle = get(selectedAsset, 'balance.display', symbol);

  const onPressSend = useCallback(() => {
    navigation.navigate('SendSheet', { asset });
  }, [asset, navigation]);

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
  navigation: PropTypes.object,
};

export default TokenExpandedState;
