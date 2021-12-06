import React from 'react';
import { useIsEmulator } from 'react-native-device-info';
import styled from 'styled-components';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const CrossHairAspectRatio = 230 / 375;

const Container = styled(Centered)`
  ${({ size }) => position.size(size)};
  margin-bottom: 1;
  z-index: 1;
`;

const Crosshair = styled(Icon).attrs({
  name: 'crosshair',
})`
  ${position.cover};
`;

export default function QRCodeScannerCrosshair() {
  const { width: deviceWidth } = useDimensions();
  const { result: isEmulator } = useIsEmulator();

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container size={deviceWidth * CrossHairAspectRatio}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Crosshair color={colors.whiteLabel} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text color="whiteLabel" lineHeight="none" size="large" weight="heavy">
        {isEmulator ? 'Simulator Mode' : 'Find a code to scan'}
      </Text>
    </Container>
  );
}
