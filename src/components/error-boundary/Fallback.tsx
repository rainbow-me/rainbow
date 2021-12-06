import React from 'react';
import { View } from 'react-native';
import RNExitApp from 'react-native-exit-app';
import styled from 'styled-components';
import { Centered } from '../layout';
import { SheetActionButton } from '../sheet';
import Text from '../text/Text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/context' or its co... Remove this comment to see the full error message
import { useTheme } from '@rainbow-me/context';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

const Spacer = styled(View)<{ height: Number }>`
  height: ${({ height }) => `${height}`};
`;

const Container = styled(View)`
  height: 100%;
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Message = styled(View)`
  text-align: center;
  padding: 30px;
`;

export default function Fallback() {
  const { colors } = useTheme();
  const handleRestart = () => {
    logger.sentry('Restarting app after Error Boundary catch');
    RNExitApp.exitApp();
  };
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Message>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text align="center" color={colors.dark} size="bigger" weight="heavy">
            Oops! 😅
          </Text>
        </Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Spacer height={15} />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text
            align="center"
            color={colors.alpha(colors.blueGreyDark, 0.7)}
            lineHeight="loose"
            size="large"
            weight="bold"
          >
            Something went wrong.
          </Text>
        </Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Spacer height={21} />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text
            align="center"
            color={colors.alpha(colors.blueGreyDark, 0.7)}
            lineHeight="loose"
            size="large"
            weight="bold"
          >
            Don&apos;t worry, your wallets are safe! Just restart the app to get
            back to business.
          </Text>
        </Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Spacer height={33} />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SheetActionButton
            color={colors.alpha(colors.appleBlue, 0.06)}
            isTransparent
            label="🌈 Restart Rainbow"
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
