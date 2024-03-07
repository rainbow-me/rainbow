import { ButtonPressAnimation } from '@/components/animations';
import { Page } from '@/components/layout';
import { Box, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import React from 'react';

export default function DappBrowserScreen() {
  const { navigate } = useNavigation();

  return (
    <Box as={Page} flex={1} height="full" width="full" alignItems="center" justifyContent="center">
      <ButtonPressAnimation
        onPress={() => {
          // navigate(Routes.DAPP_BROWSER);
        }}
        style={{ backgroundColor: 'blue', width: 100, height: 50, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text size="20pt" color="label">
          Dapp Browser
        </Text>
      </ButtonPressAnimation>
    </Box>
  );
}
