import { get } from 'lodash';
import React, { Fragment, useCallback } from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components/primitives';
import networkInfo from '../helpers/networkInfo';
import networkTypes from '../helpers/networkTypes';
import { useNavigation } from '../navigation/Navigation';
import { magicMemo } from '../utils';
import Divider from './Divider';
import { Button } from './buttons';
import { Centered } from './layout';
import { Text } from './text';
import Routes from '@rainbow-me/routes';
import { colors, margin, padding } from '@rainbow-me/styles';

const ButtonContainerHeight = 193;
const ButtonContainerWidth = 250;

const InterstitialMargin = 19;

const ButtonContainer = styled(Centered).attrs({ direction: 'column' })`
  width: ${ButtonContainerWidth};
`;

const InterstitialButton = styled(Button)`
  ${padding(12, 16, 16)};
  shadow-color: ${colors.dark};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.25;
  shadow-radius: 6;
`;

const DividerContainer = styled(Centered)`
  ${margin(InterstitialMargin, 0)}
  width: 93;
`;

const Container = styled(Centered)`
  left: 50%;
  position: absolute;
  top: 50%;
`;

const Paragraph = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.3),
  lineHeight: 'paragraphSmall',
  size: 'lmedium',
})`
  margin-top: ${InterstitialMargin};
`;

const buildInterstitialTransform = offsetY => ({
  transform: [
    { translateX: (ButtonContainerWidth / 2) * -1 },
    { translateY: (ButtonContainerHeight / 2) * -1 + 25 + offsetY },
  ],
});

const onAddFromFaucet = network => {
  const faucetUrl = get(networkInfo[network], 'faucet_url');
  Linking.openURL(faucetUrl);
};

const AddFundsInterstitial = ({ network, offsetY = 0 }) => {
  const { navigate } = useNavigation();

  const handlePressAddFunds = useCallback(
    () => navigate(Routes.RECEIVE_MODAL),
    [navigate]
  );

  const handlePressImportWallet = useCallback(
    () => navigate(Routes.IMPORT_SEED_PHRASE_FLOW),
    [navigate]
  );

  return (
    <Container style={buildInterstitialTransform(offsetY)}>
      <ButtonContainer>
        <InterstitialButton
          backgroundColor={colors.appleBlue}
          onPress={handlePressAddFunds}
        >
          Add Funds
        </InterstitialButton>
        <DividerContainer>
          <Divider inset={false} />
        </DividerContainer>
        {network === networkTypes.mainnet ? (
          <Fragment>
            <InterstitialButton
              backgroundColor={colors.paleBlue}
              onPress={handlePressImportWallet}
            >
              Import My Wallet
            </InterstitialButton>
            <Paragraph>
              If you already have an Ethereum wallet, you can securely import it
              with a seed phrase or private key.
            </Paragraph>
          </Fragment>
        ) : (
          <Fragment>
            <InterstitialButton
              backgroundColor={colors.paleBlue}
              onPress={() => onAddFromFaucet(network)}
            >
              Add from Faucet
            </InterstitialButton>
            <Paragraph>
              You can request test ETH through the{' '}
              {get(networkInfo[network], 'name')} faucet.
            </Paragraph>
          </Fragment>
        )}
      </ButtonContainer>
    </Container>
  );
};

export default magicMemo(AddFundsInterstitial, ['network', 'offsetY']);
