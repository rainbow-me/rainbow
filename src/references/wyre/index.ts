import { get, keys, upperFirst } from 'lodash';
import { orderExceptions } from './orderExceptions';
import { wyreSupportedCountries } from './supportedCountries';

const WYRE_SUPPORTED_COUNTRIES_ISO = keys(wyreSupportedCountries);

const getWyreErrorOverride = error => {
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

export {
  getWyreErrorOverride,
  wyreSupportedCountries,
  WYRE_SUPPORTED_COUNTRIES_ISO,
};
