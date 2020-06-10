import { get, keys, upperFirst } from 'lodash';
import { orderExceptions } from './orderExceptions';
import { supportedCountries } from './supportedCountries';

const WYRE_SUPPORTED_COUNTRIES_ISO = keys(supportedCountries);

const getErrorOverride = error => {
  const { errorCategory, errorCode, errorMessage } = error;
  const errorMessageDetails = get(orderExceptions, [
    `${errorCategory}`,
    `${errorCode}`,
  ]);
  if (!errorMessageDetails) {
    return {
      ...error,
      errorMessage: upperFirst(errorMessage),
      tryAgain: true,
    };
  }
  const { message, tryAgain } = errorMessageDetails;
  return {
    ...error,
    errorMessage: upperFirst(message || errorMessage),
    tryAgain,
  };
};

export { getErrorOverride, supportedCountries, WYRE_SUPPORTED_COUNTRIES_ISO };
