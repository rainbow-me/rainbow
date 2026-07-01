import React, { memo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text, useBackgroundColor, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';

import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';

type SetupStepLayoutProps = {
  title: string;
  children?: ReactNode;
};

export const SetupStepLayout = memo(function SetupStepLayout({ title, children }: SetupStepLayoutProps) {
  const { next, back } = useCashDepositSetupNavigation();
  const blue = useForegroundColor('blue');
  const surfaceSecondary = useBackgroundColor('surfaceSecondary');
  const insets = useSafeAreaInsets();

  return (
    <Box
      background="surfacePrimaryElevated"
      height="full"
      paddingHorizontal="24px"
      width="full"
      style={{ paddingBottom: insets.bottom + 16, paddingTop: insets.top + 24 }}
    >
      <ButtonPressAnimation onPress={back} scaleTo={0.8} testID="cash-setup-back">
        <Box
          alignItems="center"
          borderRadius={18}
          height={{ custom: 36 }}
          justifyContent="center"
          style={{ backgroundColor: surfaceSecondary }}
          width={{ custom: 36 }}
        >
          <Text align="center" color="label" size="17pt" weight="heavy">
            {'􀆉'}
          </Text>
        </Box>
      </ButtonPressAnimation>

      <Box paddingTop="24px">
        <Text color="label" size="26pt" weight="heavy">
          {title}
        </Text>
      </Box>

      <Box style={styles.body}>{children}</Box>

      <ButtonPressAnimation onPress={next} scaleTo={0.96} testID="cash-setup-next">
        <Box alignItems="center" borderRadius={52} height={{ custom: 48 }} justifyContent="center" style={{ backgroundColor: blue }}>
          <Text align="center" color="white" size="20pt" weight="heavy">
            {i18n.t(i18n.l.cash.deposit_setup.next)}
          </Text>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
});

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
});
