import { forEach } from 'lodash';
import React, { useEffect, useMemo } from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { cloudPlatform } from '../../utils/platform';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Column, Row, RowWithMargins } from '../layout';
import { GradientText, Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { deviceUtils } from '@rainbow-me/utils';

const deviceWidth = deviceUtils.dimensions.width;

const Container = styled(Column)`
  margin-top: -8;
`;

const CaretIcon = styled(Icon).attrs({
  name: 'caret',
})`
  margin-bottom: 5.25;
`;

const SheetRow = styled(Row).attrs({
  scaleTo: 0.975,
})`
  padding-horizontal: 30;
  padding-top: 11;
  width: 100%;
`;

const TitleRow = styled(RowWithMargins)`
  align-items: center;
  justify-content: space-between;
  width: ${deviceWidth - 60};
`;

const RainbowText =
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  android && IS_TESTING === 'true'
    ? Text
    : styled(GradientText).attrs(({ theme: { colors } }) => ({
        angle: false,
        colors: colors.gradients.rainbow,
        end: { x: 0, y: 0.5 },
        start: { x: 1, y: 0.5 },
        steps: [0, 0.774321, 1],
      }))``;

const TextIcon = styled(Text).attrs({
  size: 29,
  weight: 'medium',
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  height: ${android ? 45 : 35};
  margin-bottom: 7;
  margin-top: 8;
`;

const Title = styled(Text).attrs({
  letterSpacing: 'roundedMedium',
  lineHeight: 27,
  size: 'larger',
  weight: 'bold',
})`
  margin-bottom: 6;
  max-width: 276;
`;

const DescriptionText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'left',
  color: colors.alpha(colors.blueGreyDark, 0.4),
  lineHeight: 22,
  size: 'smedium',
  weight: 'medium',
}))`
  max-width: 276;
  padding-bottom: 24;
`;

export default function RestoreSheetFirstStep({
  onCloudRestore,
  onManualRestore,
  onWatchAddress,
  userData,
}: any) {
  const { setParams } = useNavigation();
  const { colors } = useTheme();

  const walletsBackedUp = useMemo(() => {
    let count = 0;
    forEach(userData?.wallets, wallet => {
      if (wallet.backedUp && wallet.backupType === WalletBackupTypes.cloud) {
        count++;
      }
    });
    return count;
  }, [userData]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  const enableCloudRestore = android || walletsBackedUp > 0;
  useEffect(() => {
    setParams({ enableCloudRestore });
  }, [enableCloudRestore, setParams]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      {enableCloudRestore && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <React.Fragment>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SheetRow as={ButtonPressAnimation} onPress={onCloudRestore}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Row>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <RainbowText colors={colors}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <TextIcon>􀌍</TextIcon>
                </RainbowText>
              </Row>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TitleRow>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <RainbowText colors={colors}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Title>Restore from {cloudPlatform}</Title>
                </RainbowText>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <CaretIcon />
              </TitleRow>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <DescriptionText>
                // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name
                'ios'.
                {ios
                  ? `You have ${walletsBackedUp} ${
                      walletsBackedUp > 1 ? 'wallets' : 'wallet'
                    } backed up`
                  : `If you previously backed up your wallet on ${cloudPlatform} tap here to restore it.`}
              </DescriptionText>
            </Column>
          </SheetRow>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Divider color={colors.rowDividerExtraLight} inset={[0, 30]} />
        </React.Fragment>
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SheetRow
        as={ButtonPressAnimation}
        onPress={onManualRestore}
        scaleTo={0.9}
        testID="restore-with-key-button"
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TextIcon color={colors.purple}>􀑚</TextIcon>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TitleRow justify="space-between" width="100%">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Title>Restore with a secret phrase or private key</Title>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <CaretIcon />
          </TitleRow>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <DescriptionText>
            Use your secret phrase from Rainbow or another crypto wallet
          </DescriptionText>
        </Column>
      </SheetRow>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Divider color={colors.rowDividerExtraLight} inset={[0, 30]} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SheetRow
        as={ButtonPressAnimation}
        onPress={onWatchAddress}
        scaleTo={0.9}
        testID="watch-address-button"
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TextIcon color={colors.mintDark}>􀒒</TextIcon>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TitleRow justify="space-between" width="100%">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Title>Watch an Ethereum address </Title>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <CaretIcon />
          </TitleRow>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <DescriptionText>Watch a public address or ENS name</DescriptionText>
        </Column>
      </SheetRow>
    </Container>
  );
}
