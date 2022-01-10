import { concat, includes } from 'lodash';

export const PERSONAL_SIGN = 'personal_sign';
export const SEND_TRANSACTION = 'eth_sendTransaction';
export const SIGN = 'eth_sign';
export const SIGN_TRANSACTION = 'eth_signTransaction';
export const SIGN_TYPED_DATA = 'eth_signTypedData';
export const SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4';

const displayTypes = {
  message: [PERSONAL_SIGN, SIGN, SIGN_TYPED_DATA],
  transaction: [SEND_TRANSACTION, SIGN_TRANSACTION],
};
const firstParamSigning = [PERSONAL_SIGN];
const secondParamSigning = [SIGN, SIGN_TYPED_DATA, SIGN_TYPED_DATA_V4];

const allTypes = concat(displayTypes.message, ...displayTypes.transaction);

export const isSigningMethod = (method: string) => includes(allTypes, method);

export const isMessageDisplayType = (method: string) =>
  includes(displayTypes.message, method);

export const isTransactionDisplayType = (method: string) =>
  includes(displayTypes.transaction, method);

export const isSignSecondParamType = (method: string) =>
  includes(secondParamSigning, method);

export const isSignFirstParamType = (method: string) =>
  includes(firstParamSigning, method);
