import lang from 'i18n-js';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import { Box, Inline } from '@rainbow-me/design-system';
import { useColorForAsset } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { useTheme } from '@rainbow-me/theme';

const Container = styled(ButtonPressAnimation)({
  marginRight: 4,
});

const MaxButtonLabel = styled(Text).attrs({
  align: 'center',
  size: 'lmedium',
  weight: 'bold',
})({
  marginTop: 3,
});

interface ExchangeMaxButtonProps {
  address: string;
  mainnetAddress?: string;
  disabled: boolean;
  onPress: () => void;
  testID: string;
}

export default function ExchangeMaxButton({
  address,
  mainnetAddress,
  disabled,
  onPress,
  testID,
}: ExchangeMaxButtonProps) {
  const colorForAsset = useColorForAsset({
    address,
    mainnet_address: mainnetAddress,
  });
  const { colors } = useTheme();

  return (
    <Container disabled={disabled} onPress={onPress} testID={testID}>
      <Inline>
        <Box height="30px" paddingHorizontal="19px">
          <MaxButtonLabel color={colorForAsset || colors.appleBlue}>
            􀜍 {lang.t('exchange.max')}
          </MaxButtonLabel>
        </Box>
      </Inline>
    </Container>
  );
}
