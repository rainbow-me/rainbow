import { PaymentRequest } from 'react-native-payments';

export const getApplePayPaymentRequest = (
  methodData,
  paymentDetails,
  paymentOptions
) => {
  const paymentRequest = new PaymentRequest(
    methodData,
    paymentDetails,
    paymentOptions
  );
  paymentRequest.addEventListener('shippingaddresschange', e => {
    const updatedPaymentDetails = paymentRequest._details;
    e.updateWith(updatedPaymentDetails);
  });
  console.log('make a payment request', paymentRequest);
  return paymentRequest;
};
