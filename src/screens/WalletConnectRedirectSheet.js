import React, { useEffect } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components';
import { Centered } from '../components/layout';
import { Sheet } from '../components/sheet';
import { Text } from '../components/text';
import { useAppState } from '../hooks';
import { colors } from '../styles';

const BodyText = styled(Text).attrs({
  align: 'center',
  color: colors.blueGreyDark50,
  lineHeight: 'loosest',
  size: 'big',
})`
  padding-bottom: 23;
  padding-top: 4;
`;

const emojisMap = {
  'connect': '🥳',
  'reject': '👻',
  'sign': '🥳',
  'sign-canceled': '👻',
  'transaction': '🥳',
  'transaction-canceled': '👻',
};

const titlesMap = {
  'connect': "You're connected!",
  'reject': 'Connection canceled',
  'sign': 'Message signed!',
  'sign-canceled': 'Transaction canceled!',
  'transaction': 'Transaction sent!',
  'transaction-canceled': 'Transaction canceled!',
};

const WalletConnectRedirectSheet = () => {
  const { goBack, getParam } = useNavigation();
  const { appState } = useAppState();

  const type = getParam('type');

  useEffect(() => {
    if (appState === 'background') {
      goBack();
    }
  }, [goBack, appState]);

  return (
    <Sheet>
      <Centered direction="column" paddingTop={12}>
        <Text letterSpacing="zero" size="h2">
          {emojisMap[type]}
        </Text>
        <Centered marginTop={9}>
          <Text size="big" weight="bold">
            {titlesMap[type]}
          </Text>
        </Centered>
        <BodyText>Go back to your browser</BodyText>
      </Centered>
    </Sheet>
  );
};

export default React.memo(WalletConnectRedirectSheet);
