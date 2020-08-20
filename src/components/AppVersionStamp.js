import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import { loadAllKeysOnly } from '../model/keychain';
import { Text } from './text';
import { useAppVersion, useTimeout } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';

const DEBUG_TAP_COUNT = 15;

async function showDebugAlert() {
  const keys = await loadAllKeysOnly();
  Alert.alert('DEBUG INFO', JSON.stringify(keys, null, 2));
}

const StampText = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.2),
  lineHeight: 'normal',
  size: 'smedium',
  weight: 'bold',
})``;

export default function AppVersionStamp() {
  const appVersion = useAppVersion();
  const [numberOfTaps, setNumberOfTaps] = useState(0);
  const [startTimeout, stopTimeout] = useTimeout();

  const handleVersionPress = useCallback(() => {
    stopTimeout();

    const tapCount = numberOfTaps + 1;
    setNumberOfTaps(tapCount);

    // Only show the secret "debug info" alert if the
    // user has tapped this AppVersionStamp the secret amount of times
    if (tapCount === DEBUG_TAP_COUNT) {
      showDebugAlert();
    }

    startTimeout(() => setNumberOfTaps(0), 3000);
  }, [numberOfTaps, startTimeout, stopTimeout]);

  return (
    <TouchableWithoutFeedback onPress={handleVersionPress}>
      <StampText>{appVersion}</StampText>
    </TouchableWithoutFeedback>
  );
}
