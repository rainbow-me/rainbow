import React, { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import { Text } from '@/design-system';
import { useAppVersion, useTimeout } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { IS_ANDROID, IS_IOS } from '@/env';

const DEBUG_TAP_COUNT = 15;

const StyledButton = styled(Pressable)({
  paddingTop: IS_IOS ? 32 : 16,
  paddingBottom: IS_ANDROID ? 32 : 0,
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
    <StyledButton hitSlop={10} onPress={handleVersionPress}>
      <Text color="secondary30 (Deprecated)" size="14px / 19px (Deprecated)" weight="bold">
        {appVersion}
      </Text>
    </StyledButton>
  );
}
