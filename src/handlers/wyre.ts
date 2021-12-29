// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@rai... Remove this comment to see the full error message
import { PaymentRequest } from '@rainbow-me/react-native-payments';
import { captureException } from '@sentry/react-native';
import { get, join, split, toLower, values } from 'lodash';
import {
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  RAINBOW_WYRE_MERCHANT_ID,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  RAINBOW_WYRE_MERCHANT_ID_TEST,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  WYRE_ACCOUNT_ID,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  WYRE_ACCOUNT_ID_TEST,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  WYRE_ENDPOINT,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  WYRE_ENDPOINT_TEST,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  WYRE_TOKEN,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  WYRE_TOKEN_TEST,
} from 'react-native-dotenv';
import { RAINBOW_FETCH_ERROR, RainbowFetchClient } from '../rainbow-fetch';
import NetworkTypes from '@rainbow-me/helpers/networkTypes';
import { WYRE_SUPPORTED_COUNTRIES_ISO } from '@rainbow-me/references';
import { subtract } from '@rainbow-me/utilities';
import logger from 'logger';

const SOURCE_CURRENCY_USD = 'USD';
const PAYMENT_PROCESSOR_COUNTRY_CODE = 'US';

export const PaymentRequestStatusTypes = {
  FAIL: 'fail',
  SUCCESS: 'success',
};

const getBaseUrl = (network: any) =>
  network === NetworkTypes.mainnet ? WYRE_ENDPOINT : WYRE_ENDPOINT_TEST;

const wyreApi = new RainbowFetchClient({
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

const WyreExceptionTypes = {
  CREATE_ORDER: 'WyreCreateOrderException',
};

class WyreException extends Error {
  constructor(
    name: any,
    referenceInfo: any,
    errorId: any,
    errorCode: any,
    message: any
  ) {
    const referenceInfoIds = values(referenceInfo);
    const referenceId = join(referenceInfoIds, ':');
    super(`${referenceId}:${errorId}:${errorCode}:${message}`);
    this.name = name;
  }
}

export const getReferenceId = (accountAddress: any) => {
  const lowered = toLower(accountAddress);
  return lowered.substr(-12);
};

export const showApplePayRequest = async (
  referenceInfo: any,
  accountAddress: any,
  destCurrency: any,
  sourceAmountWithFees: any,
  purchaseFee: any,
  sourceAmount: any,
  network: any
) => {
  const feeAmount = subtract(sourceAmountWithFees, sourceAmount);
  const networkFee = subtract(feeAmount, purchaseFee);

  const merchantIdentifier =
    network === NetworkTypes.mainnet
      ? RAINBOW_WYRE_MERCHANT_ID
      : RAINBOW_WYRE_MERCHANT_ID_TEST;

  const methodData = [
    {
      data: {
        countryCode: PAYMENT_PROCESSOR_COUNTRY_CODE,
        currencyCode: SOURCE_CURRENCY_USD,
        merchantIdentifier,
        supportedCountries: WYRE_SUPPORTED_COUNTRIES_ISO,
        supportedNetworks: ['visa', 'mastercard', 'discover'],
      },
      supportedMethods: ['apple-pay'],
    },
  ];

  const paymentDetails = getWyrePaymentDetails(
    sourceAmount,
    destCurrency,
    networkFee,
    purchaseFee,
    sourceAmountWithFees
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
    return paymentResponse;
  } catch (error) {
    logger.sentry(
      `Apple Pay - Show payment request catch - ${referenceInfo.referenceId}`
    );
    captureException(error);
    return null;
  }
};

export const getWalletOrderQuotation = async (
  amount: any,
  destCurrency: any,
  accountAddress: any,
  network: any
) => {
  const partnerId =
    network === NetworkTypes.mainnet ? WYRE_ACCOUNT_ID : WYRE_ACCOUNT_ID_TEST;
  const dest = `ethereum:${accountAddress}`;
  const data = {
    accountId: partnerId,
    amount,
    country: PAYMENT_PROCESSOR_COUNTRY_CODE,
    dest,
    destCurrency,
    sourceCurrency: SOURCE_CURRENCY_USD,
    walletType: 'APPLE_PAY',
  };
  const baseUrl = getBaseUrl(network);
  try {
    const wyreAuthToken =
      network === NetworkTypes.mainnet ? WYRE_TOKEN : WYRE_TOKEN_TEST;
    const config = {
      headers: {
        Authorization: `Bearer ${wyreAuthToken}`,
      },
    };
    const response = await wyreApi.post(
      `${baseUrl}/v3/orders/quote/partner`,
      data,
      config
    );
    const responseData = response?.data;
    const purchaseFee = responseData?.fees[SOURCE_CURRENCY_USD];
    return {
      purchaseFee,
      sourceAmountWithFees: responseData?.sourceAmount,
    };
  } catch (error) {
    logger.sentry('Apple Pay - error getting wallet order quotation', error);
    return null;
  }
};

export const reserveWyreOrder = async (
  amount: any,
  destCurrency: any,
  accountAddress: any,
  network: any,
  paymentMethod = null
) => {
  const partnerId =
    network === NetworkTypes.mainnet ? WYRE_ACCOUNT_ID : WYRE_ACCOUNT_ID_TEST;
  const dest = `ethereum:${accountAddress}`;
  const data = {
    amount,
    dest,
    destCurrency,
    referrerAccountId: partnerId,
    sourceCurrency: SOURCE_CURRENCY_USD,
  };
  if (paymentMethod) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'paymentMethod' does not exist on type '{... Remove this comment to see the full error message
    data.paymentMethod = paymentMethod;
  }
  const baseUrl = getBaseUrl(network);
  try {
    const wyreAuthToken =
      network === NetworkTypes.mainnet ? WYRE_TOKEN : WYRE_TOKEN_TEST;
    const config = {
      headers: {
        Authorization: `Bearer ${wyreAuthToken}`,
      },
    };
    const response = await wyreApi.post(
      `${baseUrl}/v3/orders/reserve`,
      data,
      config
    );
    return response?.data;
  } catch (error) {
    logger.sentry('Apple Pay - error reserving order', error);
    return null;
  }
};

export const trackWyreOrder = async (
  referenceInfo: any,
  orderId: any,
  network: any
) => {
  try {
    const baseUrl = getBaseUrl(network);
    const response = await wyreApi.get(`${baseUrl}/v3/orders/${orderId}`);
    const orderStatus = get(response, 'data.status');
    const transferId = get(response, 'data.transferId');
    return { data: response.data, orderStatus, transferId };
  } catch (error) {
    throw error;
  }
};

export const trackWyreTransfer = async (
  referenceInfo: any,
  transferId: any,
  network: any
) => {
  try {
    const baseUrl = getBaseUrl(network);
    const response = await wyreApi.get(
      `${baseUrl}/v2/transfer/${transferId}/track`
    );
    const transferHash = get(response, 'data.blockchainNetworkTx');
    const destAmount = get(response, 'data.destAmount');
    const destCurrency = get(response, 'data.destCurrency');
    return { destAmount, destCurrency, transferHash };
  } catch (error) {
    throw error;
  }
};

export const getOrderId = async (
  referenceInfo: any,
  paymentResponse: any,
  amount: any,
  accountAddress: any,
  destCurrency: any,
  network: any,
  reservationId: any
) => {
  const data = createPayload(
    referenceInfo,
    paymentResponse,
    amount,
    accountAddress,
    destCurrency,
    network,
    reservationId
  );
  try {
    const baseUrl = getBaseUrl(network);
    const response = await wyreApi.post(
      `${baseUrl}/v3/apple-pay/process/partner`,
      data
    );

    const orderId = get(response, 'data.id', null);

    return { orderId };
  } catch (error: any) {
    if (error && error.type === RAINBOW_FETCH_ERROR) {
      const { responseBody } = error;

      logger.sentry('WYRE - getOrderId response - was not 200', responseBody);
      const {
        data: { errorCode, exceptionId, message, type },
      } = responseBody;

      captureException(
        new WyreException(
          WyreExceptionTypes.CREATE_ORDER,
          referenceInfo,
          exceptionId,
          errorCode,
          message
        )
      );
      return {
        errorCategory: type,
        errorCode,
        errorMessage: message,
      };
    } else {
      logger.sentry(
        `WYRE - getOrderId response catch - ${referenceInfo.referenceId}`
      );
      captureException(error);
      return {};
    }
  }
};

const getWyrePaymentDetails = (
  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'sourceAmount' implicitly has an 'any' t... Remove this comment to see the full error message
  sourceAmount,
  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'destCurrency' implicitly has an 'any' t... Remove this comment to see the full error message
  destCurrency,
  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'networkFee' implicitly has an 'any' typ... Remove this comment to see the full error message
  networkFee,
  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'purchaseFee' implicitly has an 'any' ty... Remove this comment to see the full error message
  purchaseFee,
  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'totalAmount' implicitly has an 'any' ty... Remove this comment to see the full error message
  totalAmount
) => ({
  displayItems: [
    {
      amount: { currency: SOURCE_CURRENCY_USD, value: sourceAmount },
      label: destCurrency,
    },
    {
      amount: { currency: SOURCE_CURRENCY_USD, value: purchaseFee },
      label: 'Purchase Fee',
    },
    {
      amount: { currency: SOURCE_CURRENCY_USD, value: networkFee },
      label: 'Network Fee',
    },
  ],

  id: 'rainbow-wyre',

  total: {
    amount: { currency: SOURCE_CURRENCY_USD, value: totalAmount },
    label: 'Rainbow',
  },
});

const createPayload = (
  referenceInfo: any,
  paymentResponse: any,
  amount: any,
  accountAddress: any,
  destCurrency: any,
  network: any,
  reservationId: any
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

  const partnerId =
    network === NetworkTypes.mainnet ? WYRE_ACCOUNT_ID : WYRE_ACCOUNT_ID_TEST;
  return {
    partnerId,
    payload: {
      orderRequest: {
        amount,
        dest,
        destCurrency,
        referenceId: referenceInfo.referenceId,
        referrerAccountId: partnerId,
        reservationId,
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

const getAddressDetails = (addressInfo: any) => {
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
