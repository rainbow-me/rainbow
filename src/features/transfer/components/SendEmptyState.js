import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Centered } from '@/components/layout';
import { opacity } from '@/framework/ui/utils/opacity';
import { sheetVerticalOffset } from '@/navigation/effects';
import { useTheme } from '@/theme/ThemeContext';

export const SendEmptyState = () => {
  const { colors } = useTheme();

  const icon = <Icon color={opacity(colors.blueGreyDark, 0.06)} height={88} name="send" style={sx.icon} width={91} />;

  if (Platform.OS === 'android') {
    return <View style={sx.androidContainer}>{icon}</View>;
  }

  return (
    <Centered backgroundColor={colors.white} flex={1} justify="space-between" paddingBottom={sheetVerticalOffset + 19}>
      {icon}
    </Centered>
  );
};

const sx = StyleSheet.create({
  androidContainer: { alignItems: 'center', flex: 1 },
  icon: {
    marginBottom: Platform.OS === 'ios' ? 0 : 150,
    marginTop: Platform.OS === 'ios' ? 0 : 150,
  },
});
