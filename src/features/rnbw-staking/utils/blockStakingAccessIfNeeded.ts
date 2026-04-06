import { Alert } from 'react-native';
import * as i18n from '@/languages';
import { getIsHardwareWallet, getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import watchingAlert from '@/utils/watchingAlert';

export function blockRnbwStakingAccessIfNeeded(): boolean {
  const isReadOnlyWallet = getIsReadOnlyWallet();

  if (isReadOnlyWallet) {
    watchingAlert();
    return true;
  }

  const isHardwareWallet = getIsHardwareWallet();

  if (isHardwareWallet) {
    showHardwareWalletNotSupportedAlert();
    return true;
  }

  return false;
}

function showHardwareWalletNotSupportedAlert() {
  Alert.alert(
    i18n.t(i18n.l.rnbw_staking.wallet_access.hardware_wallet_not_supported_title),
    i18n.t(i18n.l.rnbw_staking.wallet_access.hardware_wallet_not_supported_message)
  );
}
