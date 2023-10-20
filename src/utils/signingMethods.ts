export const PERSONAL_SIGN = 'personal_sign';
export const SEND_TRANSACTION = 'eth_sendTransaction';
export const SIGN_TRANSACTION = 'eth_signTransaction';
export const SIGN_TYPED_DATA = 'eth_signTypedData';
export const SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4';

const displayTypes = {
  message: [PERSONAL_SIGN, SIGN_TYPED_DATA, SIGN_TYPED_DATA_V4],
  transaction: [SEND_TRANSACTION, SIGN_TRANSACTION],
};
const firstParamSigning = [PERSONAL_SIGN];
const secondParamSigning = [SIGN_TYPED_DATA, SIGN_TYPED_DATA_V4];

const allTypes = displayTypes.message.concat(displayTypes.transaction);

export const isSigningMethod = (method: string) => allTypes.includes(method);

export const isMessageDisplayType = (method: string) =>
  displayTypes.message.includes(method);

export const isTransactionDisplayType = (method: string) =>
  displayTypes.transaction.includes(method);

export const isSignSecondParamType = (method: string) =>
  secondParamSigning.includes(method);

export const isSignFirstParamType = (method: string) =>
  firstParamSigning.includes(method);

export const isSignTypedData = (method: string) =>
  method.startsWith(SIGN_TYPED_DATA);
