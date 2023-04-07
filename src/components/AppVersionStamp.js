import React, { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import { Text } from '@/design-system';
import { useAppVersion, useTimeout } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';

const DEBUG_TAP_COUNT = 15;

const StyledButton = styled(Pressable)({
  marginBottom: -10,
  paddingBottom: 10,
  paddingHorizontal: 40,
});

export default function AppVersionStamp() {
  const [appVersion, codePushVersion] = useAppVersion();
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
      navigate(Routes.WALLET_DIAGNOSTICS_SHEET);
    }
    startTimeout(() => setNumberOfTaps(0), 3000);
  }, [navigate, numberOfTaps, startTimeout, stopTimeout]);
  const [showCodePushVersion, setShowCodePushVersion] = useState(false);

  return (
    <StyledButton
      onLongPress={() => setShowCodePushVersion(true)}
      onPress={handleVersionPress}
      onPressOut={() => setTimeout(() => setShowCodePushVersion(false), 500)}
    >
      <Text
        color="secondary30 (Deprecated)"
        size="14px / 19px (Deprecated)"
        weight="bold"
      >
        {showCodePushVersion ? `Update: ${codePushVersion}` : appVersion}
      </Text>
    </StyledButton>
  );
}
