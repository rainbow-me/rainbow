import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import WalletTypes from '../../helpers/walletTypes';
import { useAccountAssets, useWallets } from '../../hooks';
import Routes from '../../screens/Routes/routesNames';
import { ethereumUtils } from '../../utils';
import FloatingPanels from './FloatingPanels';
import { AssetPanel, AssetPanelAction, AssetPanelHeader } from './asset-panel';

const TokenExpandedState = ({ asset }) => {
  const { navigate, goBack } = useNavigation();
  const { address, name, symbol } = asset;
  const { assets } = useAccountAssets();
  const { selectedWallet } = useWallets();
  const selectedAsset = ethereumUtils.getAsset(assets, address);
  const price = get(selectedAsset, 'native.price.display', null);
  const subtitle = get(selectedAsset, 'balance.display', symbol);

  const onPressSend = useCallback(() => {
    if (selectedWallet.type !== WalletTypes.readOnly) {
      navigate(Routes.SEND_SHEET, { asset });
    } else {
      goBack();
      Alert.alert(`You need to import the wallet in order to do this`);
    }
  }, [asset, goBack, navigate, selectedWallet.type]);

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
};

export default TokenExpandedState;
