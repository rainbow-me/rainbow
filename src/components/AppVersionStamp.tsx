import React, { useCallback, useState } from 'react';
import { Platform, Pressable } from 'react-native';

import { Text } from '@/design-system';
import { IS_DEV, IS_STORE_INSTALL } from '@/env';
import styled from '@/framework/ui/styled-thing';
import useAppVersion from '@/hooks/useAppVersion';
import useTimeout from '@/hooks/useTimeout';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

const DEBUG_TAP_COUNT = 15;

const StyledButton = styled(Pressable)({
  paddingTop: Platform.OS === 'ios' ? 32 : 16,
  paddingBottom: Platform.OS === 'android' ? 32 : 0,
  paddingHorizontal: 40,
  alignItems: 'center',
});

export function AppVersionStamp() {
  const appVersion = useAppVersion();
  const [numberOfTaps, setNumberOfTaps] = useState(0);
  const [startTimeout, stopTimeout] = useTimeout();
  const { navigate } = useNavigation();

  const handleVersionPress = useCallback(async () => {
    stopTimeout();

    const tapCount = numberOfTaps + 1;
    setNumberOfTaps(tapCount);
    // Only show the WALLET_DIAGNOSTICS_SHEET if the
    // user has tapped this AppVersionStamp the secret amount of times
    if (tapCount === DEBUG_TAP_COUNT) {
      navigate(Routes.DIAGNOSTICS_SHEET);
    }
    startTimeout(() => setNumberOfTaps(0), 3000);
  }, [navigate, numberOfTaps, startTimeout, stopTimeout]);

  return (
    <StyledButton testID="app-version-stamp" hitSlop={10} onPress={handleVersionPress}>
      <Text color="secondary30 (Deprecated)" size="14px / 19px (Deprecated)" weight="bold">
        {`${appVersion} · ${IS_DEV ? 'dev' : IS_STORE_INSTALL ? 'store' : 'internal'}`}
      </Text>
    </StyledButton>
  );
}
