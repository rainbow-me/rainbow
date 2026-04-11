import * as React from 'react';
import { ActivityIndicator } from 'react-native';

import Spinner from '@/components/Spinner';
import { IS_IOS } from '@/env';
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
  if (IS_IOS) {
    return <ActivityIndicatorIos color={colors.black} />;
  } else {
    return <Spinner color={colors.black} />;
  }
};
