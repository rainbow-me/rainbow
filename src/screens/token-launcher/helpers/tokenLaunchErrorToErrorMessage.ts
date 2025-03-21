import { TokenLauncherSDKError, TokenLauncherErrorCode } from '@rainbow-me/token-launcher';
import lang from 'i18n-js';

export const tokenLaunchErrorToErrorMessage = (error: TokenLauncherSDKError) => {
  if (error.code === TokenLauncherErrorCode.API_REQUEST_FAILED || error.code === TokenLauncherErrorCode.API_RESPONSE_INVALID) {
    return {
      header: lang.t('token_launcher.errors.header'),
      body: lang.t('token_launcher.errors.api_request_failed'),
    };
  } else if (error.code === TokenLauncherErrorCode.CONTRACT_INTERACTION_FAILED) {
    return {
      header: lang.t('token_launcher.errors.header'),
      body: lang.t('token_launcher.errors.contract_interaction_failed'),
    };
  } else if (error.code === TokenLauncherErrorCode.GAS_ESTIMATION_FAILED) {
    return {
      header: lang.t('token_launcher.errors.header'),
      body: lang.t('token_launcher.errors.gas_estimation_failed'),
    };
  } else if (error.code === TokenLauncherErrorCode.INSUFFICIENT_FUNDS) {
    return {
      header: lang.t('token_launcher.errors.header'),
      body: lang.t('token_launcher.errors.insufficient_funds'),
    };
  } else if (error.code === TokenLauncherErrorCode.INVALID_PARAMS) {
    return {
      header: lang.t('token_launcher.errors.header'),
      body: lang.t('token_launcher.errors.invalid_params'),
    };
  } else if (error.code === TokenLauncherErrorCode.MISSING_REQUIRED_PARAM) {
    return {
      header: lang.t('token_launcher.errors.header'),
      body: lang.t('token_launcher.errors.missing_required_param'),
    };
  } else if (error.code === TokenLauncherErrorCode.SUBMISSION_DETAILS_MISSING) {
    return {
      header: lang.t('token_launcher.errors.header'),
      body: lang.t('token_launcher.errors.submission_details_missing'),
    };
  } else if (error.code === TokenLauncherErrorCode.TRANSACTION_FAILED) {
    return {
      header: lang.t('token_launcher.errors.header'),
      body: lang.t('token_launcher.errors.transaction_failed'),
    };
  } else if (error.code === TokenLauncherErrorCode.UNKNOWN_ERROR) {
    return {
      header: lang.t('token_launcher.errors.header'),
      body: lang.t('token_launcher.errors.unknown_error'),
    };
  } else if (error.code === TokenLauncherErrorCode.WALLET_CONNECTION_ERROR) {
    return {
      header: lang.t('token_launcher.errors.header'),
      body: lang.t('token_launcher.errors.wallet_connection_error'),
    };
  }
  return {
    header: lang.t('token_launcher.errors.header'),
    body: lang.t('token_launcher.errors.unknown_error'),
  };
};
