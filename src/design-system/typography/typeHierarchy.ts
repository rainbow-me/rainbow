/* eslint-disable sort-keys-fix/sort-keys-fix */
export const typeHierarchy = {
  heading: {
    '23px': {
      fontSize: 23,
      letterSpacing: 0.6,
      lineHeight: 27,
      marginCorrection: {
        ios: -0.3,
        android: -0.3,
      },
    },
    '20px': {
      fontSize: 20,
      letterSpacing: 0.6,
      lineHeight: 24,
      marginCorrection: {
        ios: -0.5,
        android: 0,
      },
    },
    '18px': {
      fontSize: 18,
      letterSpacing: 0.5,
      lineHeight: 21,
      marginCorrection: {
        ios: 0,
        android: 0.2,
      },
    },
  },

  text: {
    '18px': {
      fontSize: 18,
      letterSpacing: 0.6,
      lineHeight: 27,
      marginCorrection: {
        ios: -0.3,
        android: 2.4,
      },
    },
    '16px': {
      fontSize: 16,
      letterSpacing: 0.5,
      lineHeight: 24,
      marginCorrection: {
        ios: -0.5,
        android: 2.4,
      },
    },
    '14px': {
      fontSize: 14,
      letterSpacing: 0.6,
      lineHeight: 17,
      marginCorrection: {
        ios: -0.3,
        android: -0.1,
      },
    },
    '11px': {
      fontSize: 11,
      letterSpacing: 0.6,
      lineHeight: 13,
      marginCorrection: {
        ios: -0.3,
        android: -0.3,
      },
    },
  },
} as const;
