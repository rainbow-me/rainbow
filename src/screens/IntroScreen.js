import PropTypes from 'prop-types';
import React from 'react';
import { StatusBar } from 'react-native';
import lang from 'i18n-js';
import { compose, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import AppVersionStamp from '../components/AppVersionStamp';
import { ButtonPressAnimation } from '../components/buttons';
import Icon from '../components/icons/Icon';
import { Column, Row } from '../components/layout';
import { Monospace } from '../components/text';
import { colors, fonts, padding } from '../styles';
import { withHideSplashScreenOnMount, withSafeAreaViewInsetValues } from '../hoc';

const AlphaWarning = styled(Row).attrs({ align: 'center' })`
  margin-top: 37;
  margin-bottom: 7;
`;

const AlphaWarningText = styled(Monospace).attrs({
  color: 'orangeLight',
  size: 'lmedium',
  weight: 'medium',
})`
  line-height: ${fonts.lineHeight.looser};
`;

const Container = styled(Column).attrs({ align: 'start', justify: 'center' })`
  ${padding(0, 30)}
  background-color: ${colors.black};
  height: 100%;
`;

const Content = styled(Column)`
  margin-bottom: 10;
`;

const CreateWalletButton = styled.View`
  ${padding(14, 18, 17)}
  background-color: ${colors.teal};
  border-radius: 14;
  margin-top: 47;
`;

const CreateWalletButtonText = styled(Monospace).attrs({
  color: 'black',
  size: 'h5',
  weight: 'semibold',
})`
  line-height: 20;
`;

const InstructionsText = styled(Monospace).attrs({
  color: 'white',
  size: 'lmedium',
})`
  color: ${colors.alpha(colors.white, 0.46)};
  line-height: ${fonts.lineHeight.looser};
  width: 315;
`;

const IntroAppVersion = styled(AppVersionStamp)`
  bottom: ${({ bottomInset }) => bottomInset};
  left: 0;
  position: absolute;
  right: 0;
`;

const WarningIcon = styled(Icon).attrs({
  color: colors.orangeLight,
  name: 'warning',
})`
  margin-right: ${fonts.size.micro};
`;

const IntroScreen = ({ onCreateWallet, safeAreaInset }) => (
  <Container>
    <StatusBar barStyle="light-content" />
    <Content>
      <Monospace color="white" size="big" weight="semibold">
        {lang.t('wallet.intro.welcome')}
      </Monospace>
      <AlphaWarning>
        <WarningIcon />
        <AlphaWarningText>{lang.t('wallet.intro.warning')}</AlphaWarningText>
      </AlphaWarning>
      <InstructionsText>
        {lang.t('wallet.intro.instructions')}
      </InstructionsText>
      <Row>
        <ButtonPressAnimation onPress={onCreateWallet}>
          <CreateWalletButton>
            <CreateWalletButtonText>
              {lang.t('wallet.intro.create_wallet')}
            </CreateWalletButtonText>
          </CreateWalletButton>
        </ButtonPressAnimation>
      </Row>
    </Content>
    <IntroAppVersion
      bottomInset={safeAreaInset.bottom}
      color="#2A2B30"
    />
  </Container>
);

IntroScreen.propTypes = {
  navigation: PropTypes.object,
  onCreateWallet: PropTypes.func,
  safeAreaInset: PropTypes.object,
};

export default compose(
  withHideSplashScreenOnMount,
  withSafeAreaViewInsetValues,
  withHandlers({
    onCreateWallet: ({ navigation }) => () => navigation.navigate('WalletScreen'),
  }),
)(IntroScreen);
