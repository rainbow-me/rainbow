import PropTypes from 'prop-types';
import React from 'react';
import { get } from 'lodash';
import { Linking } from 'react-native';
import { withNavigation } from 'react-navigation';
import { compose, pure, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import networkTypes from '../helpers/networkTypes';
import networkInfo from '../helpers/networkInfo';
import { colors, margin, padding } from '../styles';
import { Button } from './buttons';
import Divider from './Divider';
import { Centered } from './layout';
import { Text } from './text';

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
  const faucet_url = get(networkInfo[network], 'faucet_url');
  Linking.openURL(faucet_url);
};

const AddFundsInterstitial = ({
  network,
  offsetY,
  onPressAddFunds,
  onPressImportWallet,
}) => (
  <Container style={buildInterstitialTransform(offsetY)}>
    <ButtonContainer>
      <InterstitialButton
        backgroundColor={colors.appleBlue}
        onPress={onPressAddFunds}
      >
        Add Funds
      </InterstitialButton>
      <DividerContainer>
        <Divider inset={false} />
      </DividerContainer>
      {network === networkTypes.mainnet ? (
        <React.Fragment>
          <InterstitialButton
            backgroundColor={colors.paleBlue}
            onPress={onPressImportWallet}
          >
            Import My Wallet
          </InterstitialButton>
          <Paragraph>
            If you already have an Ethereum wallet, you can securely import it
            with a seed phrase or private key.
          </Paragraph>
        </React.Fragment>
      ) : (
        <React.Fragment>
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
        </React.Fragment>
      )}
    </ButtonContainer>
  </Container>
);

AddFundsInterstitial.propTypes = {
  offsetY: PropTypes.number,
  onPressAddFunds: PropTypes.func.isRequired,
  onPressImportWallet: PropTypes.func.isRequired,
};

AddFundsInterstitial.defaultProps = {
  offsetY: 0,
};

export default compose(
  pure,
  withNavigation,
  withHandlers({
    onPressAddFunds: ({ navigation }) => () => {
      console.log('should go to modal');
      navigation.navigate('ReceiveModal');
    },
    onPressImportWallet: ({ navigation }) => () =>
      navigation.navigate('ImportSeedPhraseSheet'),
  })
)(AddFundsInterstitial);
