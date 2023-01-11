import { captureMessage } from '@sentry/react-native';
import lang from 'i18n-js';
import React, { Fragment, useCallback } from 'react';
import { Linking, View } from 'react-native';
import networkInfo from '../helpers/networkInfo';
import networkTypes from '../helpers/networkTypes';
import showWalletErrorAlert from '../helpers/support';
import { useNavigation } from '../navigation/Navigation';
import { useTheme } from '../theme/ThemeContext';
import { deviceUtils, magicMemo } from '../utils';
import Divider from './Divider';
import { ButtonPressAnimation, ScaleButtonZoomableAndroid } from './animations';
import { Icon } from './icons';
import { Centered, Row, RowWithMargins } from './layout';
import { Text } from './text';
import { analyticsV2 } from '@/analytics';
import { useAccountSettings, useDimensions, useWallets } from '@/hooks';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { padding, position } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';
import config from '@/model/config';
import { useRoute } from '@react-navigation/core';

const ContainerWidth = 261;

const Container = styled(Centered).attrs({ direction: 'column' })(
  ({ isSmallPhone }) => ({
    ...(isSmallPhone && { bottom: 80 }),
    position: 'absolute',
    top: 60,
    width: ContainerWidth,
  })
);

const InterstitialButton = styled(ButtonPressAnimation).attrs({
  borderRadius: 23,
})();

const InterstitialButtonContent = styled(View).attrs(
  ({ theme: { colors } }) => ({
    backgroundColor: colors.alpha(colors.blueGreyDark, 0.06),
    borderRadius: 23,
  })
)({
  ...padding.object(11, 15, 14),
});

const InterstitialButtonRow = styled(Row)({
  marginBottom: ({ isSmallPhone }) => (isSmallPhone ? 19 : 42),
});

const InterstitialDivider = styled(Divider).attrs(({ theme: { colors } }) => ({
  color: colors.rowDividerExtraLight,
  inset: [0, 0, 0, 0],
}))({
  borderRadius: 1,
});

const CopyAddressButton = styled(ButtonPressAnimation).attrs({
  borderRadius: 23,
})();

const CopyAddressButtonContent = styled(RowWithMargins).attrs(
  ({ theme: { colors } }) => ({
    backgroundColor: colors.alpha(colors.appleBlue, 0.06),
    borderRadius: 23,
    margin: 6,
  })
)({
  ...padding.object(10.5, 15, 14.5),
});

const AmountBPA = styled(ButtonPressAnimation)({
  borderRadius: 25,
  overflow: 'visible',
});

const Paragraph = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.4),
  letterSpacing: 'roundedMedium',
  lineHeight: 'paragraphSmall',
  size: 'lmedium',
  weight: 'semibold',
}))({
  marginBottom: 24,
  marginTop: 19,
});

const Title = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.dark,
  lineHeight: 32,
  size: 'bigger',
  weight: 'heavy',
}))({
  marginHorizontal: 27,
});

const Subtitle = styled(Title).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
}))({
  marginTop: ({ isSmallPhone }) => (isSmallPhone ? 19 : 42),
});

const AmountText = styled(Text).attrs(({ children }) => ({
  align: 'center',
  children: android ? `  ${children.join('')}  ` : children,
  letterSpacing: 'roundedTightest',
  size: 'bigger',
  weight: 'heavy',
}))(({ color }) => ({
  ...(android ? padding.object(15, 4.5) : padding.object(24, 15, 25)),
  alignSelf: 'center',
  textShadowColor: color,
  textShadowOffset: { height: 0, width: 0 },
  textShadowRadius: 20,
  zIndex: 1,
}));

const { isVeryNarrowPhone } = deviceUtils;

const AmountButtonWrapper = styled(Row).attrs({
  justify: 'center',
  marginLeft: isVeryNarrowPhone ? 5 : 7.5,
  marginRight: isVeryNarrowPhone ? 5 : 7.5,
})({
  ...(android && { width: isVeryNarrowPhone ? 95 : 100 }),
});

const onAddFromFaucet = accountAddress =>
  Linking.openURL(`https://faucet.paradigm.xyz/?addr=${accountAddress}`);

const InnerBPA = android ? ButtonPressAnimation : ({ children }) => children;

const Wrapper = android ? ScaleButtonZoomableAndroid : AmountBPA;

const AmountButton = ({ amount, backgroundColor, color, onPress }) => {
  const handlePress = useCallback(() => onPress?.(amount), [amount, onPress]);
  const { colors } = useTheme();
  const shadows = {
    [colors.swapPurple]: [
      [0, 5, 15, colors.shadow, 0.2],
      [0, 10, 30, colors.swapPurple, 0.4],
    ],
    [colors.purpleDark]: [
      [0, 5, 15, colors.shadow, 0.2],
      [0, 10, 30, colors.purpleDark, 0.4],
    ],
  };

  return (
    <AmountButtonWrapper>
      <Wrapper disabled={android} onPress={handlePress}>
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={backgroundColor}
          borderRadius={25}
          shadows={shadows?.[backgroundColor] || []}
          {...(android && {
            height: 80,
            width: isVeryNarrowPhone ? 95 : 100,
          })}
        />
        <InnerBPA
          onPress={handlePress}
          reanimatedButton
          wrapperStyle={{
            zIndex: 10,
          }}
        >
          <AmountText color={color} textShadowColor={color}>
            ${amount}
          </AmountText>
        </InnerBPA>
      </Wrapper>
    </AmountButtonWrapper>
  );
};

const AddFundsInterstitial = ({ network }) => {
  const { isSmallPhone } = useDimensions();
  const { navigate } = useNavigation();
  const { isDamaged } = useWallets();
  const { accountAddress } = useAccountSettings();
  const { colors } = useTheme();
  const { name: routeName } = useRoute();

  const handlePressAmount = useCallback(
    amount => {
      if (isDamaged) {
        showWalletErrorAlert();
        captureMessage('Damaged wallet preventing add cash');
        return;
      }

      if (!config.wyre_enabled) {
        navigate(Routes.EXPLAIN_SHEET, { type: 'wyre_degradation' });
        return;
      }

      if (ios) {
        navigate(Routes.ADD_CASH_FLOW, {
          params: !isNaN(amount) ? { amount } : null,
          screen: Routes.ADD_CASH_SCREEN_NAVIGATOR,
        });
        analyticsV2.track(analyticsV2.event.buyButtonPressed, {
          amount,
          componentName: 'AddFundsInterstitial',
          newWallet: true,
          routeName,
        });
      } else {
        navigate(Routes.WYRE_WEBVIEW_NAVIGATOR, {
          params: {
            address: accountAddress,
            amount: !isNaN(amount) ? amount : null,
          },
          screen: Routes.WYRE_WEBVIEW,
        });
        analyticsV2.track(analyticsV2.event.buyButtonPressed, {
          amount,
          componentName: 'AddFundsInterstitial',
          newWallet: true,
          routeName,
        });
      }
    },
    [isDamaged, navigate, routeName, accountAddress]
  );

  const addFundsToAccountAddress = useCallback(
    () => onAddFromFaucet(accountAddress),
    [accountAddress]
  );

  const handlePressCopyAddress = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }
    navigate(Routes.RECEIVE_MODAL);
  }, [navigate, isDamaged]);

  return (
    <Container isSmallPhone={isSmallPhone}>
      {network === networkTypes.mainnet ? (
        <Fragment>
          <Title>
            {ios
              ? lang.t('add_funds.to_get_started_ios')
              : lang.t('add_funds.to_get_started_android')}
          </Title>
          <Row justify="space-between" marginVertical={30}>
            <AmountButton
              amount={100}
              backgroundColor={colors.swapPurple}
              color={colors.neonSkyblue}
              onPress={handlePressAmount}
            />
            <AmountButton
              amount={200}
              backgroundColor={colors.swapPurple}
              color={colors.neonSkyblue}
              onPress={handlePressAmount}
            />
            <AmountButton
              amount={300}
              backgroundColor={colors.purpleDark}
              color={colors.pinkLight}
              onPress={handlePressAmount}
            />
          </Row>
          <InterstitialButtonRow>
            <InterstitialButton onPress={handlePressAmount} radiusAndroid={23}>
              <InterstitialButtonContent>
                <Text
                  align="center"
                  color={colors.alpha(colors.blueGreyDark, 0.6)}
                  lineHeight="loose"
                  size="large"
                  weight="bold"
                >
                  {`􀍡 ${lang.t('wallet.add_cash.interstitial.other_amount')}`}
                </Text>
              </InterstitialButtonContent>
            </InterstitialButton>
          </InterstitialButtonRow>
          {!isSmallPhone && <InterstitialDivider />}
          <Subtitle isSmallPhone={isSmallPhone}>
            {lang.t('add_funds.eth.or_send_eth')}
          </Subtitle>

          <Paragraph>
            {lang.t('add_funds.eth.send_from_another_source')}
          </Paragraph>
        </Fragment>
      ) : (
        <Fragment>
          <Title>
            {lang.t('add_funds.test_eth.request_test_eth', {
              testnetName: networkInfo[network]?.name,
            })}
          </Title>
          <Row marginTop={30}>
            <InterstitialButton onPress={addFundsToAccountAddress}>
              <Text
                align="center"
                color={colors.alpha(colors.blueGreyDark, 0.6)}
                lineHeight="loose"
                size="large"
                weight="bold"
              >
                􀎬 {lang.t('add_funds.test_eth.add_from_faucet')}
              </Text>
            </InterstitialButton>
          </Row>
          {!isSmallPhone && <InterstitialDivider />}
          <Subtitle isSmallPhone={isSmallPhone}>
            {lang.t('add_funds.test_eth.or_send_test_eth')}
          </Subtitle>
          <Paragraph>
            {lang.t('add_funds.test_eth.send_test_eth_from_another_source', {
              testnetName: networkInfo[network]?.name,
            })}
          </Paragraph>
        </Fragment>
      )}
      <CopyAddressButton
        onPress={handlePressCopyAddress}
        radiusAndroid={23}
        testID="copy-address-button"
      >
        <CopyAddressButtonContent>
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
            {lang.t('wallet.settings.copy_address')}
          </Text>
        </CopyAddressButtonContent>
      </CopyAddressButton>
    </Container>
  );
};

export default magicMemo(AddFundsInterstitial, ['network', 'offsetY']);
