import { InteractionManager, Platform } from 'react-native';

// @ts-expect-error eth-url-parser ships no type declarations
import { parse } from 'eth-url-parser';

import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { convertRawAmountToDecimalFormat, fromWei, isZero } from '@/helpers/utilities';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { parseAssetNative } from '@/parsers/accounts';
import store from '@/redux/store';
import ethereumUtils from '@/utils/ethereumUtils';

export async function startSendFromEthereumUrl(data: string) {
  let ethUrl;
  try {
    ethUrl = parse(data);
  } catch (e) {
    Alert.alert(i18n.t(i18n.l.wallet.alerts.invalid_ethereum_url));
    return;
  }

  const functionName = ethUrl.function_name;
  let asset = null;
  const chainId = (ethUrl.chain_id as ChainId) || ChainId.mainnet;
  const network = useBackendNetworksStore.getState().getChainsName()[chainId];
  let address: any = null;
  let nativeAmount: any = null;
  const { nativeCurrency } = store.getState().settings;

  if (!functionName) {
    // Send native asset
    const chainId = useBackendNetworksStore.getState().getChainsIdByName()[network];
    asset = ethereumUtils.getNetworkNativeAsset({ chainId });

    if (!asset || isZero(asset?.balance?.amount ?? '0')) {
      Alert.alert(i18n.t(i18n.l.wallet.alerts.ooops), i18n.t(i18n.l.wallet.alerts.dont_have_asset_in_wallet));
      return;
    }
    address = ethUrl.target_address;
    nativeAmount = ethUrl.parameters?.value && fromWei(ethUrl.parameters.value);
  } else if (functionName === 'transfer') {
    // Send ERC-20
    const targetUniqueId = ethereumUtils.getUniqueId(ethUrl.target_address, chainId);
    asset = ethereumUtils.getAccountAsset(targetUniqueId);
    if (!asset || isZero(asset?.balance?.amount ?? '0')) {
      Alert.alert(i18n.t(i18n.l.wallet.alerts.ooops), i18n.t(i18n.l.wallet.alerts.dont_have_asset_in_wallet));
      return;
    }
    address = ethUrl.parameters?.address;
    nativeAmount = ethUrl.parameters?.uint256 && convertRawAmountToDecimalFormat(ethUrl.parameters.uint256, asset.decimals);
  } else {
    Alert.alert(i18n.t(i18n.l.wallet.alerts.this_action_not_supported));
    return;
  }

  const assetWithPrice = parseAssetNative(asset, nativeCurrency);

  InteractionManager.runAfterInteractions(() => {
    const params = { address, asset: assetWithPrice, nativeAmount };
    if (Platform.OS === 'ios') {
      Navigation.handleAction(Routes.SEND_FLOW, {
        params,
        screen: Routes.SEND_SHEET,
      });
    } else {
      Navigation.handleAction(Routes.SEND_FLOW, params);
    }
  });
}
