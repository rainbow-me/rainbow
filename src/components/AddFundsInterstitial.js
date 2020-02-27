import PropTypes from 'prop-types';
import React from 'react';
import { get } from 'lodash';
import { Linking } from 'react-native';
import { withNavigation } from 'react-navigation';
import { compose, pure, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import networkTypes from '../helpers/networkTypes';
import networkInfo from '../helpers/networkInfo';
import { colors, margin } from '../styles';
import { Button } from './buttons';
import Divider from './Divider';
import { Centered } from './layout';
import { Text } from './text';

const ButtonContainerHeight = 193;
const ButtonContainerWidth = 225;

const InterstitialMargin = 18;

const ButtonContainer = styled(Centered).attrs({ direction: 'column' })`
  width: ${ButtonContainerWidth};
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
  color: colors.placeholder,
  lineHeight: 'loose',
  size: 'smedium',
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
  console.log('network', network);
  console.log('networkInfo', networkInfo);
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
      <Button backgroundColor={colors.appleBlue} onPress={onPressAddFunds}>
        Add Funds
      </Button>
      <DividerContainer>
        <Divider inset={false} />
      </DividerContainer>
      {network === networkTypes.mainnet ? (
        <React.Fragment>
          <Button backgroundColor="#5D9DF6" onPress={onPressImportWallet}>
            Import Wallet
          </Button>
          <Paragraph>
            Use your private key or 12 to 24 word seed phrase from an existing
            wallet.
          </Paragraph>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Button
            backgroundColor="#5D9DF6"
            onPress={() => onAddFromFaucet(network)}
          >
            Add from Faucet
          </Button>
          <Paragraph>
            You can request ETH through the {get(networkInfo[network], 'name')}{' '}
            faucet.
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
