import React from 'react';
import { StyleSheet, View } from 'react-native';
import { sheetVerticalOffset } from '../../navigation/effects';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { useTheme } from '@/theme';
import { useBackgroundColor } from '@/design-system';

const SendEmptyState = () => {
  const { colors } = useTheme();
  const surfacePrimaryElevated = useBackgroundColor('surfacePrimaryElevated');

  const icon = <Icon color={colors.alpha(colors.blueGreyDark, 0.06)} height={88} name="send" style={sx.icon} width={91} />;

  if (android) {
    return <View style={sx.androidContainer}>{icon}</View>;
  }

  return (
    <Centered backgroundColor={surfacePrimaryElevated} flex={1} justify="space-between" paddingBottom={sheetVerticalOffset + 19}>
      {icon}
    </Centered>
  );
};

export default SendEmptyState;

const sx = StyleSheet.create({
  androidContainer: { alignItems: 'center', flex: 1 },
  icon: {
    marginBottom: ios ? 0 : 150,
    marginTop: ios ? 0 : 150,
  },
});
