import { useMemo } from 'react';
import { Platform, type TextStyle } from 'react-native';

import { useBackgroundColor, useForegroundColor } from '@/design-system';
import { fonts } from '@/design-system/typography/typography';

export function useSetupInputTextStyle(): TextStyle {
  const fillTertiary = useBackgroundColor('fillTertiary');
  const label = useForegroundColor('label');
  return useMemo(
    () => ({
      ...fonts.SFProRounded.bold,
      backgroundColor: fillTertiary,
      borderRadius: 20,
      borderWidth: 0,
      color: label,
      fontSize: 17,
      letterSpacing: 0.37,
      paddingLeft: 14,
      paddingRight: 16,
      // Fixed height + zero vertical padding lets Android gravity center the text; a snug
      // padding-derived height positions it baseline-from-top, which sits high with this font.
      ...(Platform.OS === 'android'
        ? ({ height: 45, includeFontPadding: false, paddingVertical: 0, textAlignVertical: 'center' } as const)
        : { paddingVertical: 12 }),
    }),
    [fillTertiary, label]
  );
}
