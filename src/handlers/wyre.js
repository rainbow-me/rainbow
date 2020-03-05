import { PaymentRequest } from '@rainbow-me/react-native-payments';
import { captureException } from '@sentry/react-native';
import axios from 'axios';
import { get, last, split } from 'lodash';
import {
  RAINBOW_WYRE_MERCHANT_ID,
  WYRE_ACCOUNT_ID,
  WYRE_ENDPOINT,
} from 'react-native-dotenv';
import { add, feeCalculation } from '../helpers/utilities';

const WYRE_PERCENT_FEE = 4;
const WYRE_FLAT_FEE_USD = 0.3;
const SOURCE_CURRENCY_USD = 'USD';

const wyreApi = axios.create({
  baseURL: WYRE_ENDPOINT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
  validateStatus: function(status) {
    // do not throw error so we can get
    // exception ID and message from response
    return status >= 200;
  },
});

class WyreAPIException extends Error {
  constructor(errorID, message) {
    super(`${errorID}:${message}`);
    this.name = 'WyreAPIException';
  }
}

export const requestWyreApplePay = (
  accountAddress,
  destCurrency,
  sourceAmount,
  trackOrder
) => {
  const destAddress = `ethereum:${accountAddress}`;

  const feeAmount = feeCalculation(
    sourceAmount,
    WYRE_PERCENT_FEE,
    WYRE_FLAT_FEE_USD
  );

  const totalAmount = add(sourceAmount, feeAmount);

  const methodData = [
    {
      data: {
        countryCode: 'US',
        currencyCode: SOURCE_CURRENCY_USD,
        merchantIdentifier: RAINBOW_WYRE_MERCHANT_ID,
        supportedCountries: ['US'],
        supportedNetworks: ['visa', 'mastercard', 'amex'],
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

  paymentRequest
    .show()
    .then(paymentResponse => {
      processWyrePayment(
        paymentResponse,
        totalAmount,
        destAddress,
        destCurrency
      )
        .then(orderId => {
          trackOrder(destCurrency, orderId, paymentResponse);
        })
        .catch(() => {
          paymentResponse.complete('failure');
        });
    })
    .catch(error => {
      console.log('payment request error', error);
    });
};

export const trackWyreOrder = async orderId => {
  try {
    const response = await wyreApi.get(`/v3/orders/${orderId}`);
    if (response.status >= 200 && response.status < 300) {
      const orderStatus = get(response, 'data.status');
      const transferId = get(response, 'data.transferId');
      return { orderStatus, transferId };
    }
    const {
      data: { exceptionId, message },
    } = response;
    throw new WyreAPIException(exceptionId, message);
  } catch (error) {
    captureException(error);
    throw error;
  }
};

export const trackWyreTransfer = async transferId => {
  try {
    const response = await wyreApi.get(`/v2/transfer/${transferId}/track`);
    if (response.status >= 200 && response.status < 300) {
      const transferHash = get(response, 'data.blockchainNetworkTx');
      const destAmount = get(response, 'data.destAmount');
      const destCurrency = get(response, 'data.destCurrency');
      const statusTimeline = get(response, 'data.successTimeline', []);
      const transferStatus = get(last(statusTimeline), 'state');
      return { destAmount, destCurrency, transferHash, transferStatus };
    }
    const {
      data: { exceptionId, message },
    } = response;
    throw new WyreAPIException(exceptionId, message);
  } catch (error) {
    captureException(error);
    throw error;
  }
};

const processWyrePayment = async (
  paymentResponse,
  amount,
  dest,
  destCurrency
) => {
  const data = createPayload(paymentResponse, amount, dest, destCurrency);
  try {
    const response = await wyreApi.post('/v3/apple-pay/process/partner', data);
    if (response.status >= 200 && response.status < 300) {
      return get(response, 'data.id', null);
    }
    const {
      data: { exceptionId, message },
    } = response;
    captureException(new WyreAPIException(exceptionId, message));
    return null;
  } catch (error) {
    captureException(error);
    return null;
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

const createPayload = (paymentResponse, amount, dest, destCurrency) => {
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

  return {
    partnerId: WYRE_ACCOUNT_ID,
    payload: {
      orderRequest: {
        amount,
        dest,
        destCurrency,
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
