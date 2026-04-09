import * as i18n from '@/languages';
import { TokenLauncherErrorCode, type TokenLauncherSDKError } from '@rainbow-me/token-launcher';

export const tokenLaunchErrorToErrorMessage = (error: TokenLauncherSDKError) => {
  if (error.code === TokenLauncherErrorCode.INVALID_ADDRESS || error.code === TokenLauncherErrorCode.WALLET_CONNECTION_ERROR) {
    return {
      header: i18n.t(i18n.l.token_launcher.errors.header),
      body: i18n.t(i18n.l.token_launcher.errors.wallet_connection_error),
    };
  } else if (error.code === TokenLauncherErrorCode.CONTRACT_INTERACTION_FAILED) {
    return {
      header: i18n.t(i18n.l.token_launcher.errors.header),
      body: i18n.t(i18n.l.token_launcher.errors.contract_interaction_failed),
    };
  } else if (error.code === TokenLauncherErrorCode.GAS_ESTIMATION_FAILED) {
    return {
      header: i18n.t(i18n.l.token_launcher.errors.header),
      body: i18n.t(i18n.l.token_launcher.errors.gas_estimation_failed),
    };
  } else if (error.code === TokenLauncherErrorCode.INSUFFICIENT_FUNDS) {
    return {
      header: i18n.t(i18n.l.token_launcher.errors.header),
      body: i18n.t(i18n.l.token_launcher.errors.insufficient_funds),
    };
  } else if (error.code === TokenLauncherErrorCode.INVALID_AMOUNT_IN_PARAM || error.code === TokenLauncherErrorCode.INVALID_PROTOCOL) {
    return {
      header: i18n.t(i18n.l.token_launcher.errors.header),
      body: i18n.t(i18n.l.token_launcher.errors.invalid_params),
    };
  } else if (error.code === TokenLauncherErrorCode.MISSING_REQUIRED_PARAM) {
    return {
      header: i18n.t(i18n.l.token_launcher.errors.header),
      body: i18n.t(i18n.l.token_launcher.errors.missing_required_param),
    };
  } else if (error.code === TokenLauncherErrorCode.TRANSACTION_FAILED) {
    return {
      header: i18n.t(i18n.l.token_launcher.errors.header),
      body: i18n.t(i18n.l.token_launcher.errors.transaction_failed),
    };
  } else if (error.code === TokenLauncherErrorCode.UNSUPPORTED_CHAIN_ID) {
    return {
      header: i18n.t(i18n.l.token_launcher.errors.header),
      body: i18n.t(i18n.l.token_launcher.errors.unsupported_network),
    };
  } else if (error.code === TokenLauncherErrorCode.UNKNOWN_ERROR) {
    return {
      header: i18n.t(i18n.l.token_launcher.errors.header),
      body: i18n.t(i18n.l.token_launcher.errors.unknown_error),
    };
  }

  return {
    header: i18n.t(i18n.l.token_launcher.errors.header),
    body: i18n.t(i18n.l.token_launcher.errors.unknown_error),
  };
};
