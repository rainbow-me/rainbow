import React, { useEffect } from 'react';
import { Centered } from '@/components/layout';
import { ModalHeaderHeight } from '@/components/modal';
import { analytics } from '@/analytics';
import { SecretDisplaySection } from '@/components/secret-display/SecretDisplaySection';
import {
  BackgroundProvider,
  Box,
  Inline,
  Inset,
  Stack,
  Text,
} from '@/design-system';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';

export default function ShowSecretView() {
  useEffect(() => {
    analytics.track('Show Secret View', {
      category: 'settings backup',
    });
  }, []);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <Inset top="20px" horizontal="20px" bottom="60px">
            <Inline alignHorizontal="center" alignVertical="center">
              <Box paddingBottom="12px">
                <Text size="22pt" weight="heavy" color="label">
                  Secret Phrase
                </Text>
              </Box>
            </Inline>
            <Box paddingTop="104px">
              <SecretDisplaySection />
            </Box>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
