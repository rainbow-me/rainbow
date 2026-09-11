import React from 'react';
import { StyleSheet } from 'react-native';

import { Box, Text, TextIcon, useColorMode, type Space } from '@/design-system';
import * as i18n from '@/languages';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICKER_BORDER_WIDTH } from '@/styles/constants';

export function AddCardHint({ paddingBottom, paddingTop }: { paddingBottom?: Space; paddingTop?: Space }) {
  const { isDarkMode } = useColorMode();

  return (
    <Box alignItems="center" paddingBottom={paddingBottom} paddingTop={paddingTop}>
      <Box
        alignItems="center"
        borderRadius={20}
        borderColor={{ custom: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }}
        borderWidth={THICKER_BORDER_WIDTH}
        flexDirection="row"
        gap={3}
        height={36}
        justifyContent="center"
        style={styles.pill}
      >
        <TextIcon color="labelQuinary" height={10} size="icon 12px" weight="heavy" width={24}>
          {'􀍰'}
        </TextIcon>
        <Text align="center" color="labelQuaternary" size="15pt" weight="bold">
          {i18n.t(i18n.l.cash.add_cash_screen.add_a_card_to_continue)}
        </Text>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderCurve: 'continuous',
    paddingLeft: 10,
    paddingRight: 14,
  },
});
