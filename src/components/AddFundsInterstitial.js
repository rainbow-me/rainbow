import { get } from 'lodash';
import React, { Fragment, useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import networkInfo from '../helpers/networkInfo';
import networkTypes from '../helpers/networkTypes';
import showWalletErrorAlert from '../helpers/support';
import { useWallets } from '../hooks';
import { useNavigation } from '../navigation/Navigation';
import { magicMemo } from '../utils';
import { Button } from './buttons';
import { Icon } from './icons';
import { Centered, Row } from './layout';
import { Text } from './text';
import Routes from '@rainbow-me/routes';
import { colors, padding, position } from '@rainbow-me/styles';

const ButtonContainerHeight = 400;
const ButtonContainerWidth = 250;

const ButtonContainer = styled(Centered).attrs({ direction: 'column' })`
  width: ${ButtonContainerWidth};
`;

const InterstitialButton = styled(Button)`
  ${padding(10.5, 15, 14.5)};
`;

const CopyAddressButton = styled(Button)`
  ${padding(10.5, 15, 14.5)};
  border-radius: 28px;
`;

const AmountBPA = styled(Button)`
  ${padding(0, 0, 0)};
  border-radius: 25px;
`;

const Container = styled(Centered)`
  left: 50%;
  position: absolute;
  top: 50%;
`;

const Paragraph = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.3),
  lineHeight: Platform.OS === 'android' ? 'loose' : 'looser',
  size: 'lmedium',
})`
  margin-top: 19;
  margin-bottom: 24;
`;

const Title = styled(Text).attrs({
  align: 'center',
  letterSpacing: 'roundedMedium',
  lineHeight: 36,
  size: 'h3',
  weight: '800',
})``;

const AmountText = styled(Text).attrs({
  align: 'center',
  letterSpacing: 'roundedMedium',
  lineHeight: 36,
  size: 'h3',
  weight: '800',
})`
  ${padding(24, 14, 25)};
  text-shadow: 0px 0px 20px ${({ color }) => color};
  align-self: center;
  z-index: 1;
`;

const AmountButtonWrapper = styled(Row).attrs({
  marginLeft: 7.5,
  marginRight: 7.5,
})``;

const buildInterstitialTransform = offsetY => ({
  transform: [
    { translateX: (ButtonContainerWidth / 2) * -1 },
    { translateY: (ButtonContainerHeight / 2) * -1 + offsetY * 1.15 },
  ],
});

const onAddFromFaucet = network => {
  const faucetUrl = get(networkInfo[network], 'faucet_url');
  Linking.openURL(faucetUrl);
};

const shadows = {
  [colors.swapPurple]: [
    [0, 10, 30, colors.swapPurple, 0.4],
    [0, 5, 15, colors.dark, 0.2],
  ],
  [colors.purpleDark]: [
    [0, 10, 30, colors.purpleDark, 0.4],
    [0, 5, 15, colors.dark, 0.2],
  ],
};

const AmountButton = ({ amount, backgroundColor, color, onPress }) => {
  return (
    <AmountButtonWrapper>
      <AmountBPA backgroundColor={backgroundColor} onPress={onPress}>
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={backgroundColor}
          borderRadius={25}
          shadows={shadows[backgroundColor]}
        />
        <AmountText color={color} textShadowColor={color}>
          ${amount}
        </AmountText>
      </AmountBPA>
    </AmountButtonWrapper>
  );
};

const AddFundsInterstitial = ({ network, offsetY = 0 }) => {
  const { navigate } = useNavigation();
  const { selectedWallet } = useWallets();

  const openAddCash = useCallback(
    amount => {
      if (selectedWallet?.damaged) {
        showWalletErrorAlert();
        return;
      }
      navigate(Routes.ADD_CASH_FLOW, {
        params: { amount },
        screen: Routes.ADD_CASH_SCREEN_NAVIGATOR,
      });
    },
    [navigate, selectedWallet]
  );

  const handlePressCopyAddress = useCallback(() => {
    if (selectedWallet?.damaged) {
      showWalletErrorAlert();
      return;
    }
    navigate(Routes.RECEIVE_MODAL);
  }, [navigate, selectedWallet]);

  const handlePressAmount = {
    0: () => openAddCash(0),
    50: () => openAddCash(50),
    // eslint-disable-next-line sort-keys
    100: () => openAddCash(100),
    250: () => openAddCash(250),
  };

  return (
    <Container style={buildInterstitialTransform(offsetY)}>
      <ButtonContainer>
        {network === networkTypes.mainnet ? (
          <Fragment>
            <Title>To get started, buy some ETH with Apple Pay</Title>
            <Row justify="space-between" marginBottom={30} marginTop={30}>
              <AmountButton
                amount={50}
                backgroundColor={colors.swapPurple}
                color={colors.neonSkyblue}
                onPress={handlePressAmount[50]}
              />
              <AmountButton
                amount={100}
                backgroundColor={colors.swapPurple}
                color={colors.neonSkyblue}
                onPress={handlePressAmount[100]}
              />
              <AmountButton
                amount={250}
                backgroundColor={colors.purpleDark}
                color={colors.pink}
                onPress={handlePressAmount[250]}
              />
            </Row>
            <Row marginBottom={86}>
              <InterstitialButton
                backgroundColor={colors.clearGrey}
                onPress={handlePressAmount[0]}
              >
                <Text
                  color={colors.blueGreyDark60}
                  lineHeight="loose"
                  size="large"
                  weight="bold"
                >
                  􀍡{` `} Other amount
                </Text>
              </InterstitialButton>
            </Row>
            <Title>or send ETH to your wallet</Title>

            <Paragraph>
              Send from Coinbase or another exchange- or ask a friend!
            </Paragraph>
          </Fragment>
        ) : (
          <Fragment>
            <Title>
              To get started, request test ETH through the{' '}
              {get(networkInfo[network], 'name')} faucet.
            </Title>
            <Row marginBottom={86} marginTop={30}>
              <InterstitialButton
                backgroundColor={colors.clearGrey}
                onPress={() => onAddFromFaucet(network)}
              >
                <Text
                  color={colors.blueGreyDark60}
                  lineHeight="loose"
                  size="large"
                  weight="bold"
                >
                  Add from faucet
                </Text>
              </InterstitialButton>
            </Row>
            <Title>or send ETH to your wallet</Title>

            <Paragraph>
              Send it from another wallet or another exchange- or ask a friend!
            </Paragraph>
          </Fragment>
        )}
        <CopyAddressButton
          backgroundColor={colors.clearBlue}
          color={colors.appleBlue}
          onPress={handlePressCopyAddress}
        >
          <Icon color={colors.appleBlue} name="copy" size={18} />
          <Text
            color={colors.appleBlue}
            lineHeight="loose"
            size="large"
            weight="bold"
          >
            {` `}Copy address
          </Text>
        </CopyAddressButton>
      </ButtonContainer>
    </Container>
  );
};

export default magicMemo(AddFundsInterstitial, ['network', 'offsetY']);
