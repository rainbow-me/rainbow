import React, { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components';
import { Text } from './text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAppVersion, useTimeout } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';

const DEBUG_TAP_COUNT = 15;

const StyledButton = styled(Pressable)`
  padding-top: 10;
  padding-bottom: 10;
  padding-horizontal: 40;
  margin-bottom: -10;
`;

const StampText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.2),
  lineHeight: 'normal',
  size: 'smedium',
  weight: 'bold',
}))``;

export default function AppVersionStamp() {
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
      navigate(Routes.WALLET_DIAGNOSTICS_SHEET);
    }
    startTimeout(() => setNumberOfTaps(0), 3000);
  }, [navigate, numberOfTaps, startTimeout, stopTimeout]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <StyledButton onPress={handleVersionPress}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <StampText>{appVersion}</StampText>
    </StyledButton>
  );
}
