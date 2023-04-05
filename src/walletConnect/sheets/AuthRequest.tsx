import React from 'react';

import { useNavigation } from '@react-navigation/native';
import { Box, Text } from '@/design-system';
import Button from '@/components/buttons/Button';
import useAccountProfile from '@/hooks/useAccountProfile';

export function AuthRequest({
  authenticate,
}: {
  authenticate({ address }: { address: string }): Promise<void>;
}) {
  const { goBack } = useNavigation();
  const { accountAddress } = useAccountProfile();

  const auth = React.useCallback(async () => {
    await authenticate({ address: accountAddress });
    goBack();
  }, [accountAddress, authenticate, goBack]);

  return (
    <>
      <Box>
        <Text size="17pt" color="label" weight="bold">
          Hello
        </Text>

        <Button onPress={auth}>Continue</Button>
      </Box>
    </>
  );
}
