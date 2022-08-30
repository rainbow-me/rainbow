import lang from 'i18n-js';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import { Box, Inline, Text } from '@/design-system';
import { useColorForAsset } from '@/hooks';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';

const Container = styled(ButtonPressAnimation)({
  marginRight: 4,
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
        <Box height="30px" paddingHorizontal="19px" paddingTop="3px">
          <Text
            weight="bold"
            align="center"
            size="16px"
            color={{ custom: colorForAsset || colors.appleBlue }}
          >
            􀜍 {lang.t('exchange.max')}
          </Text>
        </Box>
      </Inline>
    </Container>
  );
}
