import { type TokenLauncherSDKError, TokenLauncherErrorCode } from '@rainbow-me/token-launcher';
import * as i18n from '@/languages';

export const tokenLaunchErrorToErrorMessage = (error: TokenLauncherSDKError) => {
  if (error.code === TokenLauncherErrorCode.INVALID_ADDRESS) {
    return {
      header: i18n.t(i18n.l.token_launcher.errors.header),
      body: i18n.t(i18n.l.token_launcher.errors.wallet_connection_error),
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
  } else if (error.code === TokenLauncherErrorCode.UNKNOWN_ERROR || error.code === TokenLauncherErrorCode.UNSUPPORTED_CHAIN_ID) {
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
