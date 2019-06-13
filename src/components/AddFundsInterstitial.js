import PropTypes from 'prop-types';
import React from 'react';
import { DrawerActions, withNavigation } from 'react-navigation';
import { compose, pure, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
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
    { translateY: ((ButtonContainerHeight / 2) * -1) + 25 + offsetY },
  ],
});

const AddFundsInterstitial = ({
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
      <Button backgroundColor="#5D9DF6" onPress={onPressImportWallet}>
        Import Wallet
      </Button>
      <Paragraph>
        Use your 12 to 24 word seed phrase from an existing wallet.
      </Paragraph>
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
    onPressAddFunds: ({ navigation }) => () => navigation.dispatch(DrawerActions.openDrawer()),
    onPressImportWallet: ({ navigation }) => () => navigation.navigate('ImportSeedPhraseSheet'),
  }),
)(AddFundsInterstitial);
