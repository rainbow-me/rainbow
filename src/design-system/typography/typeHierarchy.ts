/**
 * ⚠️ IMPORTANT NOTE ⚠️
 *
 * When adding/updating `fontSize` and `lineHeight` values in this file, you
 * must also validate that the `marginCorrection` values are correct for both
 * iOS and Android.
 *
 * This ensures that text is vertically centered (as much as possible) avoiding
 * the need to manually correct text layouts at the screen level, e.g. by
 * adding different padding values for iOS and Android to a container. By
 * default, vertical text alignment is inconsistent cross-platform and text
 * elements are not optically centered in their container, so it's important
 * that these corrections are made at the lowest level possible and updated
 * whenever `fontSize` and/or `lineHeight` values are added or updated.
 *
 * While adding/updating margin corrections, edit `src/config/debug.ts` and set
 * `designSystemPlaygroundEnabled` to `true`. This will cause the design system
 * playground to be rendered instead of the app itself. You can then expand the
 * text examples and check that the vertical alignment is correct while
 * updating the values. This will require some trial and error. Note that React
 * Native automatically rounds these to the nearest device pixel so you might
 * not see any difference until a large enough change has been made.
 *
 * To make it easier for reviewers, it's a good idea to include screenshots in
 * your PR showing the text size being added/modified within the design system
 * playground on both iOS and Android.
 */

export const typeHierarchy = {
  heading: {
    '18px / 21px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 18,
      letterSpacing: 0.6,
      lineHeight: 21,
      marginCorrection: {
        android: 0.2,
        ios: 0,
      },
    },
    '20px / 22px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 20,
      letterSpacing: 0.6,
      lineHeight: 22,
      marginCorrection: {
        android: 0,
        ios: -0.5,
      },
    },
    '23px / 27px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 23,
      letterSpacing: 0.6,
      lineHeight: 27,
      marginCorrection: {
        android: -0.3,
        ios: -0.3,
      },
    },
    '26px / 30px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 26,
      letterSpacing: 0.6,
      lineHeight: 30,
      marginCorrection: {
        android: -0.3,
        ios: -0.3,
      },
    },
    '28px / 33px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 28,
      letterSpacing: 0,
      lineHeight: 33,
      marginCorrection: {
        android: -0.3,
        ios: -0.3,
      },
    },
    '30px / 34px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 30,
      letterSpacing: 0.6,
      lineHeight: 34,
      marginCorrection: {
        android: 0,
        ios: 0.5,
      },
    },
    '34px / 41px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 34,
      letterSpacing: 0.6,
      lineHeight: 41,
      marginCorrection: {
        android: 0,
        ios: 0.5,
      },
    },
    '44px / 53px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 44,
      letterSpacing: 0.4,
      lineHeight: 53,
      marginCorrection: {
        android: 0,
        ios: 0.5,
      },
    },
  },
  text: {
    '11px / 13px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 11,
      letterSpacing: 0.6,
      lineHeight: 13,
      marginCorrection: {
        android: -0.3,
        ios: -0.3,
      },
    },
    '12px / 14px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 12,
      letterSpacing: 0.6,
      lineHeight: 14,
      marginCorrection: {
        android: -0.3,
        ios: -0.3,
      },
    },
    '14px / 19px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 14,
      letterSpacing: 0.6,
      lineHeight: 19,
      marginCorrection: {
        android: -0.1,
        ios: -0.3,
      },
    },
    '15px / 21px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 15,
      letterSpacing: 0.6,
      lineHeight: 21,
      marginCorrection: {
        android: 2.4,
        ios: -0.5,
      },
    },
    '16px / 22px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 16,
      letterSpacing: 0.6,
      lineHeight: 22,
      marginCorrection: {
        android: 2.4,
        ios: -0.5,
      },
    },
    '18px / 27px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 18,
      letterSpacing: 0.6,
      lineHeight: 27,
      marginCorrection: {
        android: 2.4,
        ios: -0.3,
      },
    },
    '20px / 24px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 20,
      letterSpacing: 0.6,
      lineHeight: 24,
      marginCorrection: {
        android: 0,
        ios: -0.5,
      },
    },
    '23px / 27px (Deprecated)': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 23,
      letterSpacing: 0.6,
      lineHeight: 27,
      marginCorrection: {
        android: -0.3,
        ios: -0.3,
      },
    },
    '11pt': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 11,
      letterSpacing: 0.56,
      lineHeight: 14,
      marginCorrection: {
        android: 0.3,
        ios: 0,
      },
    },
    '12pt': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 12,
      letterSpacing: 0.54,
      lineHeight: 16,
      marginCorrection: {
        android: 1,
        ios: 0,
      },
    },
    '13pt': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 13,
      letterSpacing: 0.51,
      lineHeight: 18,
      marginCorrection: {
        android: 1.3,
        ios: 0,
      },
    },
    '13pt / 135%': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 13,
      letterSpacing: 0.51,
      lineHeight: 13 * (135 / 100),
      marginCorrection: {
        android: 1.2,
        ios: 0,
      },
    },
    '13pt / 150%': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 13,
      letterSpacing: 0.51,
      lineHeight: 13 * (150 / 100),
      marginCorrection: {
        android: 2,
        ios: 0,
      },
    },
    '15pt': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 15,
      letterSpacing: 0.44,
      lineHeight: 20,
      marginCorrection: {
        android: 0.8,
        ios: 0,
      },
    },
    '15pt / 135%': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 15,
      letterSpacing: 0.44,
      lineHeight: 15 * (135 / 100),
      marginCorrection: {
        android: 1,
        ios: 0,
      },
    },
    '15pt / 150%': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 15,
      letterSpacing: 0.44,
      lineHeight: 15 * (150 / 100),
      marginCorrection: {
        android: 2,
        ios: 0,
      },
    },
    '17pt': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 17,
      letterSpacing: 0.37,
      lineHeight: 22,
      marginCorrection: {
        android: 0.6,
        ios: -0.3,
      },
    },
    '17pt / 135%': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 17,
      letterSpacing: 0.37,
      lineHeight: 17 * (135 / 100),
      marginCorrection: {
        android: 1.3,
        ios: 0,
      },
    },
    '17pt / 150%': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 17,
      letterSpacing: 0.37,
      lineHeight: 17 * (150 / 100),
      marginCorrection: {
        android: 2.6,
        ios: -0.3,
      },
    },
    '20pt': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 20,
      letterSpacing: 0.36,
      lineHeight: 24,
      marginCorrection: {
        android: 0.3,
        ios: -0.3,
      },
    },
    '20pt / 135%': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 20,
      letterSpacing: 0.36,
      lineHeight: 20 * (135 / 100),
      marginCorrection: {
        android: 1.7,
        ios: 0,
      },
    },
    '20pt / 150%': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 20,
      letterSpacing: 0.36,
      lineHeight: 20 * (150 / 100),
      marginCorrection: {
        android: 3.2,
        ios: -0.3,
      },
    },
    '22pt': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 22,
      letterSpacing: 0.34,
      lineHeight: 28,
      marginCorrection: {
        android: 0.6,
        ios: -0.3,
      },
    },
    '26pt': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 26,
      letterSpacing: 0.36,
      lineHeight: 32,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    '30pt': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 30,
      letterSpacing: 0.37,
      lineHeight: 37,
      marginCorrection: {
        android: 0.3,
        ios: -0.3,
      },
    },
    '34pt': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 34,
      letterSpacing: 0.38,
      lineHeight: 41,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    '44pt': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 44,
      letterSpacing: 0.37,
      lineHeight: 52,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 9px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 9,
      letterSpacing: 0,
      lineHeight: 12,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 10px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 10,
      letterSpacing: 0,
      lineHeight: 12,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 11px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 11,
      letterSpacing: 0,
      lineHeight: 13,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 12px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 12,
      letterSpacing: 0,
      lineHeight: 14,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 13px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 13,
      letterSpacing: 0,
      lineHeight: 18,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 14px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 14,
      letterSpacing: 0,
      lineHeight: 19,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 15px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 15,
      letterSpacing: 0,
      lineHeight: 20,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 16px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 16,
      letterSpacing: 0,
      lineHeight: 22,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 17px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 17,
      letterSpacing: 0,
      lineHeight: 22,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 18px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 18,
      letterSpacing: 0,
      lineHeight: 22,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 19px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 19,
      letterSpacing: 0,
      lineHeight: 24,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 20px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 20,
      letterSpacing: 0,
      lineHeight: 24,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 23px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 23,
      letterSpacing: 0,
      lineHeight: 27,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 26px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 26,
      letterSpacing: 0,
      lineHeight: 32,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
    'icon 28px': {
      // ⚠️ IMPORTANT: When modifying these values,
      // please read the note at the top of this file.
      fontSize: 28,
      letterSpacing: 0,
      lineHeight: 33,
      marginCorrection: {
        android: 0,
        ios: 0,
      },
    },
  },
} as const;

export type HeadingSize = keyof typeof typeHierarchy.heading;
export type TextSize = keyof typeof typeHierarchy.text;
