import React, { memo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Text } from '@/design-system';

type SetupStepLayoutProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export const SetupStepLayout = memo(function SetupStepLayout({ title, subtitle, children }: SetupStepLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <Box background="surfacePrimaryElevated" height="full" paddingHorizontal="24px" width="full" style={{ paddingTop: insets.top + 60 }}>
      <Box gap={24} paddingTop="24px">
        <Text color="label" size="26pt" weight="heavy">
          {title}
        </Text>
        {subtitle != null && (
          <Text color="labelSecondary" size="17pt / 135%" weight="bold">
            {subtitle}
          </Text>
        )}
      </Box>

      <Box style={styles.body}>{children}</Box>
    </Box>
  );
});

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
});
