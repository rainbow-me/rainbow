import lang from 'i18n-js';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';
import { useColorForAsset } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';

const Container = styled(ButtonPressAnimation)({
  marginRight: 4,
});

const MaxButtonContent = styled(Row).attrs({
  align: 'center',
})({
  ...padding.object(0, 19),
  height: 32,
});

const MaxButtonLabel = styled(Text).attrs({
  align: 'center',
  size: 'lmedium',
  weight: 'bold',
})({
  marginTop: 3,
});

export default function ExchangeMaxButton({
  address,
  mainnetAddress,
  disabled,
  onPress,
  testID,
  type,
}) {
  const colorForAsset = useColorForAsset({
    address,
    mainnet_address: mainnetAddress,
    type,
  });
  const { colors } = useTheme();

  return (
    <Container disabled={disabled} onPress={onPress} testID={testID}>
      <MaxButtonContent>
        <MaxButtonLabel color={colorForAsset || colors.appleBlue}>
          􀜍 {lang.t('exchange.max')}
        </MaxButtonLabel>
      </MaxButtonContent>
    </Container>
  );
}
