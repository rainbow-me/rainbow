const errorCategories = {
  API_EXCEPTION: 'ApiException',
  GENERAL: 'GENERAL',
  PAYMENT: 'PAYMENT',
  RATE_LIMIT: 'RATE_LIMIT',
  VALIDATION_EXCEPTION: 'ValidationException',
  WALLET_ORDER_RESERVATION: 'WOReservationException',
};

const orderCreationErrorCodes = {
  ILLEGAL_RESERVATION: 'illegalReservation',
  UNSUPPORTED_CARD_TYPE_CREDIT: 'validation.unsupportedCardType.credit',
  UNSUPPORTED_CARD_TYPE_PREPAID: 'validation.unsupportedCardType.prepaid',
  AVS: 'validation.avs',
  AVS_INVALID_BILLING: 'validation.avs.invalidBillingAddress',
  AVS_INCORRECT_BILLING: 'validation.avs.incorrectBillingAddress',
  AVS_ZIPCODE: 'validation.avs.zipcode',
  AVS_UNAVAILABLE_BILLING: 'validation.avs.unavailable',
  INVALID_REFERRER_ID: 'validation.invalidReferrerId',
  PHONE_COUNTRY_CODE: 'validation.phoneNumRequiresCountryCode',
  UNSUPPORTED_COUNTRY: 'validation.unsupportedCountry',
  INVALID_US_STATE: 'validation.invalidUsState',
  MISSING_ADDRESS_STATE: 'validation.missingAddressState',
  MISSING_GIVEN_NAME: 'validation.missingGivenName',
  MISSING_FAMILY_NAME: 'validation.missingFamilyName',
  DAILY_LIMIT_REACHED: 'limits.dailyLimitReached',
  WEEKLY_LIMIT_REACHED: 'limits.weeklyLimitReached',
  YEARLY_LIMIT_REACHED: 'limits.yearlyLimitReached',
};

export const orderExceptions = {
  [errorCategories.WALLET_ORDER_RESERVATION]: {
    [orderCreationErrorCodes.ILLEGAL_RESERVATION]: {
      message: 'Missing order reservation',
      tryAgain: true,
    },
  },
  [errorCategories.VALIDATION_EXCEPTION]: {
    [orderCreationErrorCodes.UNSUPPORTED_CARD_TYPE_CREDIT]: {
      tryAgain: true,
    },
    [orderCreationErrorCodes.UNSUPPORTED_CARD_TYPE_PREPAID]: {
      tryAgain: true,
    },
    [orderCreationErrorCodes.AVS]: {
      tryAgain: true,
    },
    [orderCreationErrorCodes.AVS_INVALID_BILLING]: {
      tryAgain: true,
    },
    [orderCreationErrorCodes.AVS_INCORRECT_BILLING]: {
      message: 'Your billing address is incorrect',
      tryAgain: true,
    },
    [orderCreationErrorCodes.AVS_ZIPCODE]: {
      message: 'Your zipcode is incorrect',
      tryAgain: true,
    },
    [orderCreationErrorCodes.AVS_UNAVAILABLE_BILLING]: {
      message:
        'We were not able to validate your billing address. Please try again later.',
      tryAgain: true,
    },
    [orderCreationErrorCodes.INVALID_REFERRER_ID]: {
      message: 'Invalid request.',
      tryAgain: false,
    },
    [orderCreationErrorCodes.PHONE_COUNTRY_CODE]: {
      tryAgain: true,
    },
    [orderCreationErrorCodes.UNSUPPORTED_COUNTRY]: {
      tryAgain: false,
    },
    [orderCreationErrorCodes.INVALID_US_STATE]: {
      tryAgain: true,
    },
    [orderCreationErrorCodes.MISSING_ADDRESS_STATE]: {
      message: 'Address state must not be empty',
      tryAgain: true,
    },
    [orderCreationErrorCodes.MISSING_GIVEN_NAME]: {
      message:
        'Please make sure to include your first name in the billing address section of the Apple Pay sheet',
      tryAgain: true,
    },
    [orderCreationErrorCodes.MISSING_FAMILY_NAME]: {
      message:
        'Please make sure to include your last name in the billing address section of the Apple Pay sheet',
      tryAgain: true,
    },
    [orderCreationErrorCodes.DAILY_LIMIT_REACHED]: {
      tryAgain: false,
    },
    [orderCreationErrorCodes.WEEKLY_LIMIT_REACHED]: {
      tryAgain: false,
    },
    [orderCreationErrorCodes.YEARLY_LIMIT_REACHED]: {
      tryAgain: false,
    },
    'validation.purchaseAmount': {
      tryAgain: false,
      message: 'Purchase Amount is too small',
    },
  },
  [errorCategories.GENERAL]: {
    UNSUPPORTED_COUNTRY: {
      tryAgain: false,
    },
    UNSUPPORTED_STATE: {
      tryAgain: false,
    },
    UNABLE_TO_PROCESS: {
      tryAgain: true,
    },
    PHONE_NUMBER_MUST_BE_MOBILE: {
      tryAgain: true,
    },
    TRANSACTION_TIMEOUT: {
      tryAgain: true,
    },
    UNKNOWN_ERROR: {
      tryAgain: true,
    },
  },
  [errorCategories.PAYMENT]: {
    BILLING_ADDRESS_MISMATCH: {
      tryAgain: true,
    },
    THREE_D_SECURE_AUTHENTICATION_FAILED: {
      tryAgain: true,
    },
    UNKNOWN_ERROR: {
      tryAgain: true,
    },
  },
  [errorCategories.RATE_LIMIT]: {
    EXCEEDED_DAILY_LIMIT: {
      tryAgain: false,
    },
    EXCEEDED_WEEKLY_LIMIT: {
      tryAgain: false,
    },
    EXCEEDED_YEARLY_LIMIT: {
      tryAgain: false,
    },
    ORDER_AMOUNT_TOO_HIGH: {
      tryAgain: false,
    },
  },
};
