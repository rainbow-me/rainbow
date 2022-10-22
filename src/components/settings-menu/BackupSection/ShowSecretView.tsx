import React, { useEffect, useMemo } from 'react';
import { Centered } from '../../layout';
import { ModalHeaderHeight } from '../../modal';
import SecretDisplaySection from '../../secret-display/SecretDisplaySection';
import { analytics } from '@/analytics';
import { ScrollView } from 'react-native';
import { Box } from '@/design-system';
import { useDimensions } from '@/hooks';
import { settingsOptions } from '@/navigation/config';
import { useTheme } from '@/theme/ThemeContext';
import ConditionalWrap from 'conditional-wrap';
import { SecretDisplayCard } from '@/components/secret-display';

export default function ShowSecretView() {
  useEffect(() => {
    analytics.track('Show Secret View', {
      category: 'settings backup',
    });
  }, []);

  const { colors } = useTheme();
  const { height } = useDimensions();
  const heightSettingsOptions = useMemo(() => settingsOptions(colors), [
    colors,
  ]);

  return (
    <ConditionalWrap
      // need to figure out how to access secretSeedLength from SecretDisplayCard
      // then put the condition equal to: if secretSeedLength > 12, show enable the conditional wrap.
      condition={true}
      wrap={children => <ScrollView>{children}</ScrollView>}
    >
      <Box
        justifyContent="center"
        alignItems="center"
        width="full"
        height={{ custom: height - heightSettingsOptions.headerStyle.height }}
      >
        <SecretDisplaySection />
      </Box>
    </ConditionalWrap>
  );
}
