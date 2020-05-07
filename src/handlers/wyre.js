import { PaymentRequest } from '@rainbow-me/react-native-payments';
import { captureException } from '@sentry/react-native';
import axios from 'axios';
import { get, join, last, split, toLower, values } from 'lodash';
import {
  RAINBOW_WYRE_MERCHANT_ID,
  RAINBOW_WYRE_MERCHANT_ID_TEST,
  WYRE_ACCOUNT_ID,
  WYRE_ACCOUNT_ID_TEST,
  WYRE_ENDPOINT,
  WYRE_ENDPOINT_TEST,
} from 'react-native-dotenv';
import { add, feeCalculation } from '../helpers/utilities';
import { WYRE_SUPPORTED_COUNTRIES_ISO } from '../references';
import { logger } from '../utils';

const WYRE_PERCENT_FEE = 4;
const WYRE_FLAT_FEE_USD = 0.3;
const SOURCE_CURRENCY_USD = 'USD';
const PAYMENT_PROCESSOR_COUNTRY_CODE = 'US';

export const PaymentRequestStatusTypes = {
  FAIL: 'fail',
  SUCCESS: 'success',
};

const wyreApi = axios.create({
  baseURL: __DEV__ ? WYRE_ENDPOINT_TEST : WYRE_ENDPOINT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

const WyreExceptionTypes = {
  CREATE_ORDER: 'WyreCreateOrderException',
};

class WyreException extends Error {
  constructor(name, referenceInfo, errorId, errorCode, message) {
    const referenceInfoIds = values(referenceInfo);
    const referenceId = join(referenceInfoIds, ':');
    super(`${referenceId}:${errorId}:${errorCode}:${message}`);
    this.name = name;
  }
}

export const getReferenceId = accountAddress => {
  const lowered = toLower(accountAddress);
  return lowered.substr(-12);
};

export const showApplePayRequest = async (
  referenceInfo,
  accountAddress,
  destCurrency,
  sourceAmount
) => {
  const feeAmount = feeCalculation(
    sourceAmount,
    WYRE_PERCENT_FEE,
    WYRE_FLAT_FEE_USD
  );

  const totalAmount = add(sourceAmount, feeAmount);

  const methodData = [
    {
      data: {
        countryCode: PAYMENT_PROCESSOR_COUNTRY_CODE,
        currencyCode: SOURCE_CURRENCY_USD,
        merchantIdentifier: __DEV__
          ? RAINBOW_WYRE_MERCHANT_ID_TEST
          : RAINBOW_WYRE_MERCHANT_ID,
        supportedCountries: WYRE_SUPPORTED_COUNTRIES_ISO,
        supportedNetworks: ['visa', 'mastercard', 'discover'],
      },
      supportedMethods: ['apple-pay'],
    },
  ];

  const paymentDetails = getWyrePaymentDetails(
    sourceAmount,
    destCurrency,
    feeAmount,
    totalAmount
  );

  const paymentOptions = {
    requestBilling: true,
    requestPayerEmail: true,
    requestPayerPhone: true,
  };

  const paymentRequest = new PaymentRequest(
    methodData,
    paymentDetails,
    paymentOptions
  );

  logger.sentry(
    `Apple Pay - Show payment request - ${referenceInfo.referenceId}`
  );

  try {
    const paymentResponse = await paymentRequest.show();
    return { paymentResponse, totalAmount };
  } catch (error) {
    logger.sentry(
      `Apple Pay - Show payment request catch - ${referenceInfo.referenceId}`
    );
    captureException(error);
    return null;
  }
};

export const trackWyreOrder = async (referenceInfo, orderId) => {
  try {
    const response = await wyreApi.get(`/v3/orders/${orderId}`);
    const orderStatus = get(response, 'data.status');
    const transferId = get(response, 'data.transferId');
    return { data: response.data, orderStatus, transferId };
  } catch (error) {
    throw error;
  }
};

export const trackWyreTransfer = async (referenceInfo, transferId) => {
  try {
    const response = await wyreApi.get(`/v2/transfer/${transferId}/track`);
    const transferHash = get(response, 'data.blockchainNetworkTx');
    const destAmount = get(response, 'data.destAmount');
    const destCurrency = get(response, 'data.destCurrency');
    const statusTimeline = get(response, 'data.successTimeline', []);
    const transferStatus = get(last(statusTimeline), 'state');
    return { destAmount, destCurrency, transferHash, transferStatus };
  } catch (error) {
    throw error;
  }
};

export const getOrderId = async (
  referenceInfo,
  paymentResponse,
  amount,
  accountAddress,
  destCurrency
) => {
  const data = createPayload(
    referenceInfo,
    paymentResponse,
    amount,
    accountAddress,
    destCurrency
  );
  try {
    const response = await wyreApi.post('/v3/apple-pay/process/partner', data, {
      validateStatus: function(status) {
        // do not throw error so we can get
        // exception ID and message from response
        return status >= 200;
      },
    });

    if (response.status >= 200 && response.status < 300) {
      const orderId = get(response, 'data.id', null);
      return { orderId };
    }
    logger.sentry('WYRE - getOrderId response - was not 200', response.data);
    const {
      data: { errorCode, exceptionId, message, type },
    } = response;
    captureException(
      new WyreException(
        WyreExceptionTypes.CREATE_ORDER,
        referenceInfo,
        exceptionId,
        errorCode,
        message
      )
    );
    paymentResponse.complete(PaymentRequestStatusTypes.FAIL);
    return { errorCode, type };
  } catch (error) {
    logger.sentry(
      `WYRE - getOrderId response catch - ${referenceInfo.referenceId}`
    );
    captureException(error);
    paymentResponse.complete(PaymentRequestStatusTypes.FAIL);
    return {};
  }
};

const getWyrePaymentDetails = (
  sourceAmount,
  destCurrency,
  feeAmount,
  totalAmount
) => ({
  displayItems: [
    {
      amount: { currency: SOURCE_CURRENCY_USD, value: sourceAmount },
      label: `Purchase ${destCurrency}`,
    },
    {
      amount: { currency: SOURCE_CURRENCY_USD, value: feeAmount },
      label: 'Fee',
    },
  ],
  id: 'rainbow-wyre',
  total: {
    amount: { currency: SOURCE_CURRENCY_USD, value: totalAmount },
    label: 'Rainbow',
  },
});

const createPayload = (
  referenceInfo,
  paymentResponse,
  amount,
  accountAddress,
  destCurrency
) => {
  const dest = `ethereum:${accountAddress}`;

  const {
    details: {
      billingContact: billingInfo,
      paymentData,
      paymentMethod,
      shippingContact: shippingInfo,
      transactionIdentifier,
    },
  } = paymentResponse;
  const billingContact = getAddressDetails(billingInfo);
  const shippingContact = {
    ...billingContact,
    emailAddress: shippingInfo.emailAddress,
    phoneNumber: shippingInfo.phoneNumber,
  };

  const partnerId = __DEV__ ? WYRE_ACCOUNT_ID_TEST : WYRE_ACCOUNT_ID;

  return {
    partnerId,
    payload: {
      orderRequest: {
        amount,
        dest,
        destCurrency,
        referenceId: referenceInfo.referenceId,
        referrerAccountId: partnerId,
        sourceCurrency: SOURCE_CURRENCY_USD,
      },
      paymentObject: {
        billingContact,
        shippingContact,
        token: {
          paymentData,
          paymentMethod: {
            ...paymentMethod,
            type: 'debit',
          },
          transactionIdentifier,
        },
      },
    },
  };
};

const getAddressDetails = addressInfo => {
  const { name, postalAddress: address } = addressInfo;
  const addressLines = split(address.street, '\n');
  return {
    addressLines,
    administrativeArea: address.state,
    country: address.country,
    countryCode: address.ISOCountryCode,
    familyName: name.familyName,
    givenName: name.givenName,
    locality: address.city,
    postalCode: address.postalCode,
    subAdministrativeArea: address.subAdministrativeArea,
    subLocality: address.subLocality,
  };
};
