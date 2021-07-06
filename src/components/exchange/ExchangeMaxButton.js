import React from 'react';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';
import { useColorForAsset, useColorOverrides } from '@rainbow-me/hooks';
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
}) {
  let colorForAsset = useColorForAsset({ address });
  const { colors } = useTheme();
  colorForAsset = useColorOverrides(colorForAsset);

  return (
    <Container disabled={disabled} onPress={onPress} testID={testID}>
      <MaxButtonContent>
        <MaxButtonLabel color={colorForAsset || colors.appleBlue}>
          􀜍 Max
        </MaxButtonLabel>
      </MaxButtonContent>
    </Container>
  );
}
