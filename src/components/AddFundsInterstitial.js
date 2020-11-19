import { get } from 'lodash';
import React, { Fragment, useCallback } from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components/primitives';
import networkInfo from '../helpers/networkInfo';
import networkTypes from '../helpers/networkTypes';
import showWalletErrorAlert from '../helpers/support';
import { useAccountSettings, useDimensions, useWallets } from '../hooks';
import { useNavigation } from '../navigation/Navigation';
import { magicMemo } from '../utils';
import Divider from './Divider';
import { ButtonPressAnimation } from './animations';
import { Icon } from './icons';
import { Centered, Row, RowWithMargins } from './layout';
import { Text } from './text';
import Routes from '@rainbow-me/routes';
import { colors, padding, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const ButtonContainerHeight = 400;
const ButtonContainerWidth = 261;

const ButtonContainer = styled(Centered).attrs({ direction: 'column' })`
  width: ${ButtonContainerWidth};
`;

const InterstitialButton = styled(ButtonPressAnimation).attrs({
  backgroundColor: colors.alpha(colors.blueGreyDark, 0.06),
  wrapperProps: {
    containerStyle: { height: 45, width: 200 },
    style: { flex: 1 },
  },
})`
  ${padding(10.5, 15, 14.5)};
  border-radius: 23px;
  margin-bottom: ${({ isSmallPhone }) => (isSmallPhone ? 19 : 42)};
`;

const InterstitialDivider = styled(Divider).attrs({
  color: colors.rowDividerExtraLight,
  inset: [0, 0, 0, 0],
})`
  border-radius: 1;
`;

const CopyAddressButton = styled(ButtonPressAnimation).attrs({
  backgroundColor: colors.alpha(colors.appleBlue, 0.06),
})`
  ${padding(10.5, 15, 14.5)};
  border-radius: 23px;
`;

const AmountBPA = styled(ButtonPressAnimation)`
  ${padding(0, 0, 0)};
  border-radius: 25px;
  overflow: visible;
`;

const Container = styled(Centered)`
  left: 50%;
  position: absolute;
  top: 50%;
`;

const Paragraph = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.4),
  letterSpacing: 'roundedMedium',
  lineHeight: 'paragraphSmall',
  size: 'lmedium',
  weight: 'semibold',
})`
  margin-bottom: 24;
  margin-top: 19;
`;

const Title = styled(Text).attrs({
  align: 'center',
  lineHeight: 32,
  size: 'bigger',
  weight: 'heavy',
})`
  margin-horizontal: 27;
`;

const Subtitle = styled(Title)`
  margin-top: ${({ isSmallPhone }) => (isSmallPhone ? 19 : 42)};
`;

const AmountText = styled(Text).attrs(({ children }) => ({
  align: 'center',
  children: android ? `  ${children.join('')}  ` : children,
  letterSpacing: 'roundedTightest',
  size: 'bigger',
  weight: 'heavy',
}))`
  ${android ? padding(15, 4.5) : padding(24, 15, 25)};
  align-self: center;
  text-shadow: 0px 0px 20px ${({ color }) => color};
  z-index: 1;
`;

const AmountButtonWrapper = styled(Row).attrs({
  justify: 'center',
  marginLeft: 7.5,
  marginRight: 7.5,
})`
  ${android ? 'width: 100' : ''};
`;

const buildInterstitialTransform = (isSmallPhone, offsetY) => ({
  transform: [
    { translateX: (ButtonContainerWidth / 2) * -1 },
    {
      translateY:
        (ButtonContainerHeight / 2) * -1 + offsetY - (isSmallPhone ? 44 : 22),
    },
  ],
});

const onAddFromFaucet = network => {
  const faucetUrl = get(networkInfo[network], 'faucet_url');
  Linking.openURL(faucetUrl);
};

const shadows = {
  [colors.swapPurple]: [
    [0, 5, 15, colors.dark, 0.2],
    [0, 10, 30, colors.swapPurple, 0.4],
  ],
  [colors.purpleDark]: [
    [0, 5, 15, colors.dark, 0.2],
    [0, 10, 30, colors.purpleDark, 0.4],
  ],
};

const InnerBPA = android ? ButtonPressAnimation : ({ children }) => children;

const AmountButton = ({ amount, backgroundColor, color, onPress }) => {
  const handlePress = useCallback(() => onPress?.(amount), [amount, onPress]);

  return (
    <AmountButtonWrapper>
      <AmountBPA disabled={android} onPress={handlePress}>
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={backgroundColor}
          borderRadius={25}
          shadows={shadows[backgroundColor]}
          {...(android && {
            height: 80,
            width: 100,
          })}
        />
        <InnerBPA
          disabled={ios}
          onPress={handlePress}
          radiusAndroid={25}
          radiusWrapperStyle={{ width: 100, zIndex: 1 }}
          style={{ flex: 1 }}
        >
          <AmountText color={color} textShadowColor={color}>
            ${amount}
          </AmountText>
        </InnerBPA>
      </AmountBPA>
    </AmountButtonWrapper>
  );
};

const AddFundsInterstitial = ({ network, offsetY = 0 }) => {
  const { isSmallPhone } = useDimensions();
  const { navigate } = useNavigation();
  const { isDamaged } = useWallets();
  const { accountAddress } = useAccountSettings();

  const handlePressAmount = useCallback(
    amount => {
      if (isDamaged) {
        showWalletErrorAlert();
        return;
      }
      if (ios) {
        navigate(Routes.ADD_CASH_FLOW, {
          params: !isNaN(amount) ? { amount } : null,
          screen: Routes.ADD_CASH_SCREEN_NAVIGATOR,
        });
      } else {
        navigate(Routes.WYRE_WEBVIEW_NAVIGATOR, {
          params: {
            address: accountAddress,
            amount: !isNaN(amount) ? amount : null,
          },
          screen: Routes.WYRE_WEBVIEW,
        });
      }
    },
    [isDamaged, navigate, accountAddress]
  );

  const handlePressCopyAddress = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }
    navigate(Routes.RECEIVE_MODAL);
  }, [navigate, isDamaged]);

  return (
    <Container style={buildInterstitialTransform(isSmallPhone, offsetY)}>
      <ButtonContainer>
        {network === networkTypes.mainnet ? (
          <Fragment>
            <Title>
              To get started, buy some ETH{ios ? ` with Apple Pay` : ''}
            </Title>
            <Row justify="space-between" marginVertical={30}>
              <AmountButton
                amount={50}
                backgroundColor={colors.swapPurple}
                color={colors.neonSkyblue}
                onPress={handlePressAmount}
              />
              <AmountButton
                amount={100}
                backgroundColor={colors.swapPurple}
                color={colors.neonSkyblue}
                onPress={handlePressAmount}
              />
              <AmountButton
                amount={250}
                backgroundColor={colors.purpleDark}
                color={colors.pinkLight}
                onPress={handlePressAmount}
              />
            </Row>
            <Row>
              <InterstitialButton
                onPress={handlePressAmount}
                radiusAndroid={23}
              >
                <Text
                  align="center"
                  color={colors.alpha(colors.blueGreyDark, 0.6)}
                  lineHeight="loose"
                  size="large"
                  weight="bold"
                >
                  􀍡 Other amount
                </Text>
              </InterstitialButton>
            </Row>
            {!isSmallPhone && <InterstitialDivider />}
            <Subtitle isSmallPhone={isSmallPhone}>
              or send ETH to your wallet
            </Subtitle>

            <Paragraph>
              Send from Coinbase or another exchange—or ask a friend!
            </Paragraph>
          </Fragment>
        ) : (
          <Fragment>
            <Title>
              Request test ETH through the {get(networkInfo[network], 'name')}{' '}
              faucet
            </Title>
            <Row marginTop={30}>
              <InterstitialButton onPress={() => onAddFromFaucet(network)}>
                <Text
                  align="center"
                  color={colors.alpha(colors.blueGreyDark, 0.6)}
                  lineHeight="loose"
                  size="large"
                  weight="bold"
                >
                  􀎬 Add from faucet
                </Text>
              </InterstitialButton>
            </Row>
            {!isSmallPhone && <InterstitialDivider />}
            <Subtitle isSmallPhone={isSmallPhone}>
              or send test ETH to your wallet
            </Subtitle>

            <Paragraph>
              Send test ETH from another {get(networkInfo[network], 'name')}{' '}
              wallet—or ask a friend!
            </Paragraph>
          </Fragment>
        )}
        <CopyAddressButton
          onPress={handlePressCopyAddress}
          radiusAndroid={23}
          testID="copy-address-button"
        >
          <RowWithMargins margin={6}>
            <Icon
              color={colors.appleBlue}
              marginTop={0.5}
              name="copy"
              size={19}
            />
            <Text
              align="center"
              color={colors.appleBlue}
              lineHeight="loose"
              size="large"
              weight="bold"
            >
              Copy address
            </Text>
          </RowWithMargins>
        </CopyAddressButton>
      </ButtonContainer>
    </Container>
  );
};

export default magicMemo(AddFundsInterstitial, ['network', 'offsetY']);
