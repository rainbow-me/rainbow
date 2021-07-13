import { useRoute } from '@react-navigation/native';
import { captureException } from '@sentry/react-native';
import { upperFirst } from 'lodash';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  identifyWalletType,
  loadSeedPhraseAndMigrateIfNeeded,
} from '../../model/wallet';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import { BiometricButtonContent, Button } from '../buttons';
import { CopyFloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Column, ColumnWithMargins, RowWithMargins } from '../layout';
import { Text } from '../text';
import SecretDisplayCard from './SecretDisplayCard';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import { useWallets } from '@rainbow-me/hooks';
import { margin, padding, position, shadow } from '@rainbow-me/styles';
import logger from 'logger';

const Title = styled(Text).attrs({
  align: 'center',
  size: 'larger',
  weight: 'bold',
})`
  padding-top: 20;
`;
const DescriptionText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'loosest',
  size: 'large',
}))`
  margin-bottom: 42;
  padding-horizontal: 23;
`;

const AuthenticationText = styled(Text).attrs({
  align: 'center',
  color: 'blueGreyDark',
  size: 'large',
  weight: 'normal',
})`
  ${padding(0, 60)};
`;

const CopyButtonIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.appleBlue,
  name: 'copy',
}))`
  ${position.size(16)};
  margin-top: 0.5;
`;

const CopyButtonRow = styled(RowWithMargins).attrs({
  align: 'center',
  justify: 'start',
  margin: 6,
})`
  background-color: ${({ theme: { colors } }) => colors.transparent};
  height: 34;
`;

const CopyButtonText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.appleBlue,
  letterSpacing: 'roundedMedium',
  lineHeight: 19,
  size: 'large',
  weight: 'bold',
}))``;

const ToggleSecretButton = styled(Button)`
  ${margin(0, 20)};
  ${({ theme: { colors } }) => shadow.build(0, 5, 15, colors.purple, 0.3)}
  background-color: ${({ theme: { colors } }) => colors.appleBlue};
`;

const LoadingSpinner = android ? Spinner : ActivityIndicator;

export default function SecretDisplaySection({
  onSecretLoaded,
  onWalletTypeIdentified,
}) {
  const { params } = useRoute();
  const { selectedWallet, wallets } = useWallets();
  const walletId = params?.walletId || selectedWallet.id;
  const currentWallet = wallets[walletId];
  const [visible, setVisible] = useState(true);
  const [seed, setSeed] = useState(null);
  const [type, setType] = useState(currentWallet?.type);

  const loadSeed = useCallback(async () => {
    try {
      const s = await loadSeedPhraseAndMigrateIfNeeded(walletId);
      if (s) {
        const walletType = identifyWalletType(s);
        setType(walletType);
        onWalletTypeIdentified?.(walletType);
        setSeed(s);
      }
      setVisible(!!s);
      onSecretLoaded?.(!!s);
    } catch (e) {
      logger.sentry('Error while trying to reveal secret', e);
      captureException(e);
      setVisible(false);
      onSecretLoaded?.(false);
    }
  }, [onSecretLoaded, onWalletTypeIdentified, walletId]);

  useEffect(() => {
    // Android doesn't like to show the faceID prompt
    // while the view isn't fully visible
    // so we have to add a timeout to prevent the app from freezing
    android
      ? setTimeout(() => {
          loadSeed();
        }, 300)
      : loadSeed();
  }, [loadSeed]);

  const typeLabel = type === WalletTypes.privateKey ? 'key' : 'phrase';

  const { colors } = useTheme();
  return (
    <ColumnWithMargins
      align="center"
      justify="center"
      margin={24}
      paddingHorizontal={30}
    >
      {visible ? (
        <Fragment>
          {seed ? (
            <Fragment>
              <CopyFloatingEmojis textToCopy={seed}>
                <CopyButtonRow>
                  <CopyButtonIcon />
                  <CopyButtonText>Copy to clipboard</CopyButtonText>
                </CopyButtonRow>
              </CopyFloatingEmojis>
              <SecretDisplayCard seed={seed} type={type} />
              <Column>
                <Title>⚠️ Reminder:</Title>
                <DescriptionText>
                  These words are for your eyes only. Your secret phrase gives
                  access to your entire wallet. Be very careful with it.
                </DescriptionText>
              </Column>
            </Fragment>
          ) : (
            <LoadingSpinner color={colors.blueGreyDark50} />
          )}
        </Fragment>
      ) : (
        <Fragment>
          <AuthenticationText>
            {`You need to authenticate in order to access your recovery ${typeLabel}`}
          </AuthenticationText>
          <ToggleSecretButton onPress={loadSeed}>
            <BiometricButtonContent
              color={colors.white}
              label={`Show Recovery ${upperFirst(typeLabel)}`}
              showIcon={!seed}
            />
          </ToggleSecretButton>
        </Fragment>
      )}
    </ColumnWithMargins>
  );
}
