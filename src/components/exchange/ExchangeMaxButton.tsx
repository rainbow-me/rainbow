import lang from 'i18n-js';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import { Box, Text } from '@/design-system';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';

const Container = styled(ButtonPressAnimation)({
  marginRight: 4,
});

interface ExchangeMaxButtonProps {
  color: string;
  disabled: boolean;
  onPress: () => void;
  testID: string;
}

export default function ExchangeMaxButton({ color, disabled, onPress, testID }: ExchangeMaxButtonProps) {
  const { colors } = useTheme();

  return (
    <Container disabled={disabled} onPress={onPress} testID={testID}>
      <Box height="30px" paddingHorizontal="19px (Deprecated)" paddingTop="3px" justifyContent="center">
        <Text weight="bold" align="center" size="17pt" color={{ custom: color || colors.appleBlue }}>
          􀜍 {lang.t('exchange.max')}
        </Text>
      </Box>
    </Container>
  );
}
