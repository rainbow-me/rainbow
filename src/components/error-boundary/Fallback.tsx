import lang from 'i18n-js';
import React from 'react';
import { View } from 'react-native';
import RNExitApp from 'react-native-exit-app';
import { Centered } from '../layout';
import { SheetActionButton } from '../sheet';
import Text from '../text/Text';
import styled from '@rainbow-me/styled-components';
import { useTheme } from '@rainbow-me/theme';
import logger from 'logger';

// @ts-ignore
const Spacer = styled(View)<{ height: Number }>({
  // @ts-ignore
  height: ({ height }) => height,
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

export default function Fallback() {
  const { colors } = useTheme();
  const handleRestart = () => {
    logger.sentry('Restarting app after Error Boundary catch');
    RNExitApp.exitApp();
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
          <Text
            align="center"
            color={colors.alpha(colors.blueGreyDark, 0.7)}
            lineHeight="loose"
            size="large"
            weight="bold"
          >
            {lang.t('error_boundary.something_went_wrong')}
          </Text>
        </Centered>
        <Spacer height={21} />
        <Centered>
          <Text
            align="center"
            color={colors.alpha(colors.blueGreyDark, 0.7)}
            lineHeight="loose"
            size="large"
            weight="bold"
          >
            {lang.t('error_boundary.wallets_are_safe')}
          </Text>
        </Centered>
        <Spacer height={33} />
        <Centered>
          <SheetActionButton
            color={colors.alpha(colors.appleBlue, 0.06)}
            isTransparent
            // @ts-expect-error `SheetActionButton` is untyped so `label`
            // is expected to be `null`.
            label={`🌈 ${lang.t('error_boundary.restart_rainbow')}`}
            onPress={handleRestart}
            // @ts-ignore
            size="big"
            textColor={colors.appleBlue}
            weight="heavy"
          />
        </Centered>
      </Message>
    </Container>
  );
}
