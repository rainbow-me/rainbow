import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { Column, Row } from '../layout';
import { SecretDisplaySection } from '../secret-display';
import { SheetActionButton } from '../sheet';
import { Nbsp, Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletType... Remove this comment to see the full error message
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import {
  useDimensions,
  useWalletManualBackup,
  useWallets,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const Content = styled(Column).attrs({
  align: 'center',
  justify: 'start',
})`
  flex-grow: 1;
  flex-shrink: 0;
  padding-top: ${({ isTallPhone, isSmallPhone }) =>
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android ? 30 : isTallPhone ? 45 : isSmallPhone ? 10 : 25};
`;

const Footer = styled(Column).attrs({
  justify: 'center',
})`
  ${padding(0, 15, 21)};
  width: 100%;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-bottom: ${android ? 30 : 0};
`;

const Masthead = styled(Column).attrs({
  align: 'center',
  justify: 'start',
})``;

const MastheadDescription = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  lineHeight: 'looser',
  size: 'lmedium',
}))`
  max-width: 291;
`;

const MastheadIcon = styled(Text).attrs({
  align: 'center',
  color: 'appleBlue',
  size: 21,
  weight: 'heavy',
})``;

const MastheadTitle = styled(Text).attrs({
  align: 'center',
  size: 'larger',
  weight: 'bold',
})`
  ${padding(8)};
`;

const MastheadTitleRow = styled(Row).attrs({
  align: 'center',
  justify: 'start',
})`
  padding-top: 18;
`;

export default function BackupManualStep() {
  const { isTallPhone, isSmallPhone } = useDimensions();
  const { goBack } = useNavigation();
  const { selectedWallet } = useWallets();
  const { onManuallyBackupWalletId } = useWalletManualBackup();
  const { params } = useRoute();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'walletId' does not exist on type 'object... Remove this comment to see the full error message
  const walletId = params?.walletId || selectedWallet.id;
  const { colors } = useTheme();

  const [type, setType] = useState(null);
  const [secretLoaded, setSecretLoaded] = useState(false);

  const onComplete = useCallback(() => {
    analytics.track(`Tapped "I've saved the secret"`, {
      type,
    });
    onManuallyBackupWalletId(walletId);
    analytics.track('Backup Complete', {
      category: 'backup',
      label: 'manual',
    });
    goBack();
  }, [goBack, onManuallyBackupWalletId, type, walletId]);

  useEffect(() => {
    analytics.track('Manual Backup Step', {
      category: 'backup',
      label: 'manual',
    });
  }, []);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Masthead>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <MastheadTitleRow>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <MastheadIcon>􀉆</MastheadIcon>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <MastheadTitle>Your secret phrase</MastheadTitle>
        </MastheadTitleRow>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <MastheadDescription>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <MastheadDescription weight="semibold">
            {type === WalletTypes.privateKey
              ? `This is the key to your wallet!`
              : `These words are the keys to your wallet!`}
          </MastheadDescription>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Nbsp />
          {type === WalletTypes.privateKey
            ? `Copy it and save it in your password manager, or in another secure spot.`
            : `Write them down or save them in your password manager.`}
        </MastheadDescription>
      </Masthead>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Content
        isSmallPhone={isSmallPhone}
        isTallPhone={isTallPhone}
        paddingHorizontal={30}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SecretDisplaySection
          isSmallPhone={isSmallPhone}
          onSecretLoaded={setSecretLoaded}
          onWalletTypeIdentified={setType}
        />
      </Content>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Footer>
        {secretLoaded && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <View marginTop={isSmallPhone ? -20 : 30}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SheetActionButton
              color={colors.appleBlue}
              label={`􀁣 I’ve saved ${
                type === WalletTypes.privateKey ? 'my key' : 'these words'
              }`}
              onPress={onComplete}
              size="big"
              weight="bold"
            />
          </View>
        )}
      </Footer>
    </Fragment>
  );
}
