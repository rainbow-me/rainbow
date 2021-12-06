import { useRoute } from '@react-navigation/native';
import { captureException } from '@sentry/react-native';
import { upperFirst } from 'lodash';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  identifyWalletType,
  loadSeedPhraseAndMigrateIfNeeded,
} from '../../model/wallet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../ActivityIndicator' was resolved to '/Us... Remove this comment to see the full error message
import ActivityIndicator from '../ActivityIndicator';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Spinner' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Spinner from '../Spinner';
import { BiometricButtonContent, Button } from '../buttons';
import { CopyFloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Column, ColumnWithMargins, RowWithMargins } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SecretDisplayCard' was resolved to '/Use... Remove this comment to see the full error message
import SecretDisplayCard from './SecretDisplayCard';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletType... Remove this comment to see the full error message
import WalletTypes from '@rainbow-me/helpers/walletTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useWallets } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { margin, padding, position, shadow } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

const Title = styled(Text).attrs({
  align: 'center',
  size: 'lmedium',
  weight: 'bold',
})`
  padding-top: ${isSmallPhone => (isSmallPhone ? 0 : 20)};
`;
const DescriptionText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  lineHeight: 'loose',
  size: 'lmedium',
  weight: 'semibold',
}))`
  margin-bottom: 42;
  margin-top: 5;
  padding-horizontal: 3;
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
  size: 'lmedium',
  weight: 'bold',
}))``;

const ToggleSecretButton = styled(Button)`
  ${margin(0, 20)};
  ${({ theme: { colors } }) => shadow.build(0, 5, 15, colors.purple, 0.3)}
  background-color: ${({ theme: { colors } }) => colors.appleBlue};
`;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const LoadingSpinner = android ? Spinner : ActivityIndicator;

export default function SecretDisplaySection({
  isSmallPhone,
  onSecretLoaded,
  onWalletTypeIdentified,
}: any) {
  const { params } = useRoute();
  const { selectedWallet, wallets } = useWallets();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'walletId' does not exist on type 'object... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android
      ? setTimeout(() => {
          loadSeed();
        }, 300)
      : loadSeed();
  }, [loadSeed]);

  const typeLabel = type === WalletTypes.privateKey ? 'key' : 'phrase';

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ColumnWithMargins
      align="center"
      justify="center"
      margin={16}
      paddingHorizontal={30}
    >
      {visible ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Fragment>
          {seed ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Fragment>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <CopyFloatingEmojis textToCopy={seed}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <CopyButtonRow>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <CopyButtonIcon />
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <CopyButtonText>Copy to clipboard</CopyButtonText>
                </CopyButtonRow>
              </CopyFloatingEmojis>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Column>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <SecretDisplayCard seed={seed} type={type} />
              </Column>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Column>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Title isSmallPhone={isSmallPhone}>
                  👆For your eyes only 👆
                </Title>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <DescriptionText>
                  Anyone who has these words can access your entire wallet!
                </DescriptionText>
              </Column>
            </Fragment>
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <LoadingSpinner color={colors.blueGreyDark50} />
          )}
        </Fragment>
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Fragment>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <AuthenticationText>
            {`You need to authenticate in order to access your recovery ${typeLabel}`}
          </AuthenticationText>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ToggleSecretButton onPress={loadSeed}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
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
