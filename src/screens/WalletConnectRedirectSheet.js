import { useRoute } from '@react-navigation/native';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Centered } from '../components/layout';
import { Sheet } from '../components/sheet';
import { Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import { useAppState } from '@rainbow-me/hooks';

const BodyText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  lineHeight: 'loosest',
  size: 'big',
}))`
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
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const { appState } = useAppState();
  const { params } = useRoute();

  const type = params?.type;

  useEffect(() => {
    if (appState === 'background') {
      goBack();
    }
  }, [goBack, appState]);

  return (
    <Sheet hideHandle>
      <Centered direction="column" paddingTop={12} testID="wc-redirect-sheet">
        <Text letterSpacing="zero" size="h2">
          {emojisMap[type]}
        </Text>
        <Centered marginTop={9}>
          <Text color={colors.dark} size="big" weight="bold">
            {titlesMap[type]}
          </Text>
        </Centered>
        <BodyText color={colors.dark}>Go back to your browser</BodyText>
      </Centered>
    </Sheet>
  );
};

export default React.memo(WalletConnectRedirectSheet);
