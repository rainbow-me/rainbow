import React from 'react';
import { View } from 'react-native';
import Restart from 'react-native-restart';
import styled from 'styled-components';
import { Centered } from '../layout';
import { SheetActionButton } from '../sheet';
import Text from '../text/Text';
import { useTheme } from '@rainbow-me/context';
import { useDimensions } from '@rainbow-me/hooks';

const SmallSpacer = styled(View)`
  height: 6;
`;

const Spacer = styled(View)`
  height: 23;
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
  const handleRestart = () => Restart.Restart();
  return (
    <Container>
      <Message>
        <Centered>
          <Text
            align="center"
            color={colors.alpha(colors.black, 0.8)}
            size="big"
            weight="bold"
          >
            Oops! 😅
          </Text>
        </Centered>
        <SmallSpacer />
        <Centered>
          <Text
            align="center"
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            lineHeight="loose"
            size="large"
            weight="bold"
          >
            Something went wrong.
          </Text>
        </Centered>
        <Spacer />
        <Centered>
          <Text
            align="center"
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            lineHeight="loose"
            size="large"
            weight="bold"
          >
            Don&apos;t worry, your wallets are safe! Just restart the app to get
            back to business.
          </Text>
        </Centered>
        <Spacer />
        <Centered>
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
