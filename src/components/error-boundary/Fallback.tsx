import lang from 'i18n-js';
import React from 'react';
import { View } from 'react-native';
import { Centered } from '../layout';
import { SheetActionButton } from '../sheet';
import Text from '../text/Text';
import styled from '@/styled-thing';
import { RainbowError, logger } from '@/logger';
import { Colors } from '@/styles';

const Spacer = styled(View)({
  height: ({ height }: { height: number }) => height,
});

const Container = styled(View)({
  alignItems: 'center',
  flex: 1,
  height: '100%',
  justifyContent: 'center',
});

const Message = styled(View)({
  padding: 30,
  textAlign: 'center',
});

export default function Fallback({
  colors,
  error,
  componentStack,
  resetError,
}: {
  colors: Colors;
  error: Error;
  componentStack: string;
  resetError: () => void;
}) {
  const handleRestart = () => {
    logger.error(new RainbowError('RainbowAppRestartFromErrorBoundary'), {
      data: {
        error: error.toString(),
        componentStack,
      },
    });
    resetError();
  };
  return (
    <Container>
      <Message>
        <Centered>
          <Text align="center" color={colors.dark} size="bigger" weight="heavy">
            {lang.t('error_boundary.error_boundary_oops')} 😅
          </Text>
        </Centered>
        <Spacer height={15} />
        <Centered>
          <Text align="center" color={colors.alpha(colors.blueGreyDark, 0.7)} lineHeight="loose" size="large" weight="bold">
            {lang.t('error_boundary.something_went_wrong')}
          </Text>
        </Centered>
        <Spacer height={21} />
        <Centered>
          <Text align="center" color={colors.alpha(colors.blueGreyDark, 0.7)} lineHeight="loose" size="large" weight="bold">
            {lang.t('error_boundary.wallets_are_safe')}
          </Text>
        </Centered>
        <Spacer height={33} />
        <Centered>
          <SheetActionButton
            color={colors.alpha(colors.appleBlue, 0.06)}
            isTransparent
            label={`🌈 ${lang.t('error_boundary.restart_rainbow')}`}
            onPress={handleRestart}
            size="big"
            textColor={colors.appleBlue}
            weight="heavy"
          />
        </Centered>
      </Message>
    </Container>
  );
}
