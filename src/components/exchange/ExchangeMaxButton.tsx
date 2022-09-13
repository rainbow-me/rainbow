import lang from 'i18n-js';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import { Box, Text } from '@/design-system';
import { useColorForAsset } from '@/hooks';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';
import { AssetType } from '@/entities';

const Container = styled(ButtonPressAnimation)({
  marginRight: 4,
});

interface ExchangeMaxButtonProps {
  address: string;
  mainnetAddress?: string;
  disabled: boolean;
  onPress: () => void;
  testID: string;
  type?: string;
}

export default function ExchangeMaxButton({
  address,
  mainnetAddress,
  disabled,
  onPress,
  testID,
  type,
}: ExchangeMaxButtonProps) {
  const { colors } = useTheme();

  const colorForAsset = useColorForAsset(
    {
      address,
      mainnet_address: mainnetAddress,
      type: mainnetAddress ? AssetType.token : type,
    },
    address ? undefined : colors.appleBlue
  );

  return (
    <Container disabled={disabled} onPress={onPress} testID={testID}>
      <Box
        height="30px"
        paddingHorizontal="19px (Deprecated)"
        paddingTop="3px"
        justifyContent="center"
      >
        <Text
          weight="bold"
          align="center"
          size="17pt"
          color={{ custom: colorForAsset || colors.appleBlue }}
        >
          􀜍 {lang.t('exchange.max')}
        </Text>
      </Box>
    </Container>
  );
}
