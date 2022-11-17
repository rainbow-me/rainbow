import * as React from 'react';
import Spinner from '@/components/Spinner';
import styled from '@/styled-thing';
import { IS_IOS } from '@/env';
import { useTheme } from '@/theme';
import { ActivityIndicator } from 'react-native';

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
