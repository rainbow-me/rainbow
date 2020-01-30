import { captureException } from '@sentry/react-native';
import axios from 'axios';
import {
  RAINBOW_WYRE_MERCHANT_ID,
  WYRE_ACCOUNT_ID,
  WYRE_ENDPOINT,
} from 'react-native-dotenv';
import { add } from '../helpers/utilities';
import { getApplePayPaymentRequest } from './applePay';

const WYRE_FEE = 4;

const wyreApi = axios.create({
  baseURL: WYRE_ENDPOINT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
  validateStatus: function(status) {
    // return for any status so that we can get exception ID and message from response
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
  sourceCurrency = 'USD'
) => {
  const destAddress = `ethereum:${accountAddress}`;
  const feeAmount = (sourceAmount * WYRE_FEE) / 100; // TODO JIN be aware of decimals - how do we round?
  console.log('fee amount', feeAmount);
  const totalAmount = add(sourceAmount, feeAmount);
  const methodData = [
    {
      data: {
        countryCode: 'US',
        currencyCode: sourceCurrency,
        merchantIdentifier: RAINBOW_WYRE_MERCHANT_ID,
        supportedNetworks: ['visa', 'mastercard', 'amex'],
      },
      supportedMethods: ['apple-pay'],
    },
  ];
  const paymentDetails = getWyrePaymentDetails(
    sourceAmount,
    sourceCurrency,
    destCurrency,
    feeAmount,
    totalAmount
  );
  const paymentOptions = {
    requestBilling: true,
    requestPayerEmail: true,
    requestPayerPhone: true,
  };
  const paymentRequest = getApplePayPaymentRequest(
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
        destCurrency,
        sourceCurrency
      )
        .then(isSuccess => {
          console.log('process wyre payment is success', isSuccess);
          paymentResponse.complete(isSuccess ? 'success' : 'failure');
        })
        .catch(error => {
          console.log('error!', error);
          paymentResponse.complete('failure');
        });
    })
    .catch(error => {
      console.log('payment request error', error);
    });
};

const getWyrePaymentDetails = (
  sourceAmount,
  sourceCurrency,
  destCurrency,
  feeAmount,
  totalAmount
) => ({
  displayItems: [
    {
      amount: { currency: sourceCurrency, value: sourceAmount },
      label: `Purchase ${destCurrency}`,
    },
    {
      amount: { currency: sourceCurrency, value: feeAmount },
      label: `Fee ${WYRE_FEE}%`,
    },
  ],
  id: 'rainbow-wyre',
  total: {
    amount: { currency: sourceCurrency, value: totalAmount },
    label: 'Rainbow',
  },
});

const processWyrePayment = async (
  paymentResponse,
  amount,
  dest,
  destCurrency,
  sourceCurrency
) => {
  console.log('payment response', paymentResponse);
  const data = createPayload(
    paymentResponse,
    amount,
    dest,
    destCurrency,
    sourceCurrency
  );
  try {
    console.log('posting data to wyre api', data);
    const response = await wyreApi.post('/v3/apple-pay/process/partner', data);
    console.log('sendwyre response!', response);
    if (response.status >= 200 && response.status < 300) {
      return true;
    }
    const {
      data: { exceptionId, message },
    } = response;
    captureException(new WyreAPIException(exceptionId, message));
    return false;
  } catch (error) {
    captureException(error);
    return false;
  }
};

const createPayload = (
  paymentResponse,
  amount,
  dest,
  destCurrency,
  sourceCurrency
) => {
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
        sourceCurrency,
      },
      paymentObject: {
        billingContact: getAddressDetails(billingInfo),
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
  return {
    addressLines: [address.street],
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
