import React from 'react';
import { StyleSheet } from 'react-native';

import { Box, Text, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';

export function AddCardHint() {
  const shadowFar = useForegroundColor('shadowFar');

  return (
    <Box alignItems="center" paddingTop="28px">
      <Box
        alignItems="center"
        background="surfaceSecondaryElevated"
        flexDirection="row"
        gap={8}
        style={[styles.pill, { shadowColor: shadowFar }]}
      >
        <Text color="labelQuaternary" size="icon 12px" weight="heavy">
          {'􀍰'}
        </Text>
        <Text color="labelTertiary" size="15pt" weight="bold">
          {i18n.t(i18n.l.cash.add_cash_screen.add_a_card_to_continue)}
        </Text>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderCurve: 'continuous',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
});
