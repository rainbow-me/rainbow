import React from 'react';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useColorForAsset } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const Container = styled(ButtonPressAnimation)`
  margin-right: 4;
`;

const MaxButtonContent = styled(Row).attrs({
  align: 'center',
})`
  ${padding(0, 19)};
  height: 32;
`;

const MaxButtonLabel = styled(Text).attrs({
  align: 'center',
  size: 'lmedium',
  weight: 'bold',
})`
  margin-top: 3;
`;

export default function ExchangeMaxButton({
  address,
  disabled,
  onPress,
  testID,
}: any) {
  const colorForAsset = useColorForAsset({ address });
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container disabled={disabled} onPress={onPress} testID={testID}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <MaxButtonContent>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <MaxButtonLabel color={colorForAsset || colors.appleBlue}>
          􀜍 Max
        </MaxButtonLabel>
      </MaxButtonContent>
    </Container>
  );
}
