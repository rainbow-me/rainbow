import React from 'react';
import { View } from 'react-native';
import RNExitApp from 'react-native-exit-app';
import styled from 'styled-components';
import { Centered } from '../layout';
import { SheetActionButton } from '../sheet';
import Text from '../text/Text';
import { useTheme } from '@rainbow-me/context';
import { useDimensions } from '@rainbow-me/hooks';
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
  const { width: deviceWidth } = useDimensions();
  const handleRestart = () => {
    logger.sentry('Restarting app after Error Boundary catch');
    RNExitApp.exitApp();
  };
  return (
    <Container>
      <Message>
        <Centered>
          <Text align="center" color={colors.dark} size="bigger" weight="heavy">
            Oops! 😅
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
            Something went wrong.
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
            Don&apos;t worry, your wallets are safe! Just restart the app to get
            back to business.
          </Text>
        </Centered>
        <Spacer height={33} />
        <Centered>
          {/* @ts-ignore */}
          <SheetActionButton
            androidWidth={deviceWidth - 60}
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
