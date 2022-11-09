// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@rai... Remove this comment to see the full error message
import { PaymentRequest } from '@rainbow-me/react-native-payments';
import { captureException } from '@sentry/react-native';
import values from 'lodash/values';

import {
  RAINBOW_WYRE_MERCHANT_ID,
  RAINBOW_WYRE_MERCHANT_ID_TEST,
  WYRE_ACCOUNT_ID,
  WYRE_ACCOUNT_ID_TEST,
  WYRE_ENDPOINT,
  WYRE_ENDPOINT_TEST,
  WYRE_TOKEN,
  WYRE_TOKEN_TEST,
} from 'react-native-dotenv';
import { RAINBOW_FETCH_ERROR, RainbowFetchClient } from '../rainbow-fetch';
import NetworkTypes from '@/helpers/networkTypes';
import { WYRE_SUPPORTED_COUNTRIES_ISO } from '@/references';
import { subtract } from '@/helpers/utilities';
import logger from '@/utils/logger';
import { logger as loggr, RainbowError } from '@/logger';

const SOURCE_CURRENCY_USD = 'USD';
const PAYMENT_PROCESSOR_COUNTRY_CODE = 'US';

export const PaymentRequestStatusTypes = {
  FAIL: 'fail',
  SUCCESS: 'success',
};

const getBaseUrl = (network: any) => WYRE_ENDPOINT_TEST;

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
    const referenceId = referenceInfoIds.join(':');
    super(`${referenceId}:${errorId}:${errorCode}:${message}`);
    this.name = name;
  }
}

export const getReferenceId = (accountAddress: any) => {
  const lowered = accountAddress.toLowerCase();
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
    loggr.error(new RainbowError(`getWalletOrderQuotation failed`), { error });
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
    loggr.error(new RainbowError(`reserveWyreOrder failed`), { error });
    return null;
  }
};

export const trackWyreOrder = async (
  referenceInfo: any,
  orderId: any,
  network: any
) => {
  const baseUrl = getBaseUrl(network);
  const response = await wyreApi.get(`${baseUrl}/v3/orders/${orderId}`);
  const orderStatus = response?.data?.status;
  const transferId = response?.data?.transferId;
  return { data: response.data, orderStatus, transferId };
};

export const trackWyreTransfer = async (
  referenceInfo: any,
  transferId: any,
  network: any
) => {
  const baseUrl = getBaseUrl(network);
  const response = await wyreApi.get(
    `${baseUrl}/v2/transfer/${transferId}/track`
  );
  const transferHash = response?.data?.blockchainNetworkTx;
  const destAmount = response?.data?.destAmount;
  const destCurrency = response?.data?.destCurrency;
  return { destAmount, destCurrency, transferHash };
};

export const getWyreWalletOrder = async (
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

    const orderId = response?.data?.id ?? null;
    let authenticationUrl = response?.data?.authenticationUrl;

    loggr.info(`getWyreWalletOrder returned`);

    if (authenticationUrl) {
      loggr.info(`getWyreWalletOrder returend an authenticationUrl`);

      const { host, pathname } = new URL(authenticationUrl);

      /**
       * If some other host or path, we will ignore for security
       * @see https://docs.sendwyre.com/docs/authentication-widget-whitelabel-api
       */
      if (
        host !== 'pay.testwyre.com' ||
        !pathname.startsWith('/authentication')
      ) {
        authenticationUrl = undefined;
        loggr.error(
          new RainbowError(
            `getWyreWalletOrder returned an invalid authenticationUrl`
          )
        );
      } else {
        loggr.error(
          new RainbowError(
            `getWyreWalletOrder returned a VALID authenticationUrl`
          )
        );
      }
    }

    return { orderId, authenticationUrl };
  } catch (error: any) {
    if (error && error.type === RAINBOW_FETCH_ERROR) {
      const { responseBody } = error;

      const {
        data: { errorCode, exceptionId, message, type },
      } = responseBody;

      loggr.error(
        new RainbowError(`getWyreWalletOrder returned non-200 response`),
        {
          wyreOrderType: WyreExceptionTypes.CREATE_ORDER,
          referenceInfo,
          exceptionId,
          errorCode,
          message,
        }
      );

      return {
        errorCategory: type,
        errorCode,
        errorMessage: message,
      };
    } else {
      loggr.error(new RainbowError(`getWyreWalletOrder threw an exception`), {
        referenceInfo,
      });
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
    triggerAuthenticationWidget: true,
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
  const addressLines = address?.street?.split('\n');
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
