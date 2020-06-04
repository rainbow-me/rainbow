import React, { useEffect } from 'react';

import FastImage from 'react-native-fast-image';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components';
import RainbowNeon from '../assets/rainbow-neon.png';
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
  padding-bottom: 30;
`;

const Icon = styled(FastImage)`
  height: 85px;
  width: 85px;
`;

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
      <Centered direction="column" paddingTop={9}>
        <Icon source={RainbowNeon} />
        <Centered marginBottom={12} marginTop={15}>
          <Text size="big" weight="bold">
            {type === 'connect' ? "You're connected!" : 'All set!'}
          </Text>
        </Centered>
        <BodyText>Go back to your browser</BodyText>
      </Centered>
    </Sheet>
  );
};

export default React.memo(WalletConnectRedirectSheet);
