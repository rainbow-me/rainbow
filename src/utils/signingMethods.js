import { concat, includes } from 'lodash';

export const PERSONAL_SIGN = 'personal_sign';
export const SEND_TRANSACTION = 'eth_sendTransaction';
export const SIGN = 'eth_sign';
export const SIGN_TRANSACTION = 'eth_signTransaction';
export const SIGN_TYPED = 'eth_signTypedData';
export const SIGN_TYPED_V3 = 'eth_signTypedData_v3';

const displayTypes = {
  message: [PERSONAL_SIGN, SIGN, SIGN_TYPED, SIGN_TYPED_V3],
  transaction: [SEND_TRANSACTION, SIGN_TRANSACTION],
};
const firstParamSigning = [PERSONAL_SIGN];
const secondParamSigning = [SIGN, SIGN_TYPED, SIGN_TYPED_V3];

const allTypes = concat(displayTypes.message, ...displayTypes.transaction);

export const isSigningMethod = method => includes(allTypes, method);

export const isMessageDisplayType = method =>
  includes(displayTypes.message, method);

export const isTransactionDisplayType = method =>
  includes(displayTypes.transaction, method);

export const isSignSecondParamType = method =>
  includes(secondParamSigning, method);

export const isSignFirstParamType = method =>
  includes(firstParamSigning, method);
