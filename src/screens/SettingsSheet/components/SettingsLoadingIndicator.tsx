import * as React from 'react';
import { ActivityIndicator, Platform } from 'react-native';

import Spinner from '@/components/Spinner';
import styled from '@/framework/ui/styled-thing';
import { useTheme } from '@/theme/ThemeContext';

const ActivityIndicatorIos = styled(ActivityIndicator).attrs({
  size: 22,
  animating: true,
})({
  marginRight: 4,
});

export const SettingsLoadingIndicator = () => {
  const { colors } = useTheme();
  if (Platform.OS === 'ios') {
    return <ActivityIndicatorIos color={colors.black} />;
  } else {
    return <Spinner color={colors.black} />;
  }
};
