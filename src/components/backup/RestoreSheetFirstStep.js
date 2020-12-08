import { forEach } from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import styled from 'styled-components';
import { cloudPlatform } from '../../utils/platform';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Column, Row, RowWithMargins } from '../layout';
import { GradientText, Text } from '../text';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import { useNavigation } from '@rainbow-me/navigation';
import { colors } from '@rainbow-me/styles';
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
  android && IS_TESTING === 'true'
    ? Text
    : styled(GradientText).attrs({
        angle: false,
        colors: colors.gradients.rainbow,
        end: { x: 0, y: 0.5 },
        start: { x: 1, y: 0.5 },
        steps: [0, 0.774321, 1],
      })``;

const TextIcon = styled(Text).attrs({
  size: 29,
  weight: 'medium',
})`
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

const DescriptionText = styled(Text).attrs({
  align: 'left',
  color: colors.alpha(colors.blueGreyDark, 0.4),
  lineHeight: 22,
  size: 'smedium',
  weight: 'medium',
})`
  max-width: 276;
  padding-bottom: 24;
`;

export default function RestoreSheetFirstStep({
  onCloudRestore,
  onManualRestore,
  onWatchAddress,
  userData,
}) {
  const { setParams } = useNavigation();

  const walletsBackedUp = useMemo(() => {
    let count = 0;
    forEach(userData?.wallets, wallet => {
      if (wallet.backedUp && wallet.backupType === WalletBackupTypes.cloud) {
        count++;
      }
    });
    return count;
  }, [userData]);

  const enableCloudRestore = android || walletsBackedUp > 0;
  useEffect(() => {
    setParams({ enableCloudRestore });
  }, [enableCloudRestore, setParams]);

  return (
    <Container>
      {enableCloudRestore && (
        <React.Fragment>
          <SheetRow as={ButtonPressAnimation} onPress={onCloudRestore}>
            <Column>
              <Row>
                <RainbowText>
                  <TextIcon>􀌍</TextIcon>
                </RainbowText>
              </Row>
              <TitleRow>
                <RainbowText>
                  <Title>Restore from {cloudPlatform}</Title>
                </RainbowText>
                <CaretIcon />
              </TitleRow>
              <DescriptionText>
                {ios
                  ? `You have ${walletsBackedUp} ${
                      walletsBackedUp > 1 ? 'wallets' : 'wallet'
                    } backed up`
                  : `If you previously backed up your wallet on ${cloudPlatform} tap here to restore it.`}
              </DescriptionText>
            </Column>
          </SheetRow>
          <Divider color={colors.rowDividerExtraLight} inset={[0, 30]} />
        </React.Fragment>
      )}
      <SheetRow
        as={ButtonPressAnimation}
        onPress={onManualRestore}
        scaleTo={0.9}
        testID="restore-with-key-button"
      >
        <Column>
          <TextIcon color={colors.purple}>􀑚</TextIcon>
          <TitleRow justify="space-between" width="100%">
            <Title>Restore with a recovery phrase or private key</Title>
            <CaretIcon />
          </TitleRow>
          <DescriptionText>
            Use your recovery phrase from Rainbow or another crypto wallet
          </DescriptionText>
        </Column>
      </SheetRow>
      <Divider color={colors.rowDividerExtraLight} inset={[0, 30]} />

      <SheetRow
        as={ButtonPressAnimation}
        onPress={onWatchAddress}
        scaleTo={0.9}
        testID="watch-address-button"
      >
        <Column>
          <TextIcon color={colors.mintDark}>􀒒</TextIcon>
          <TitleRow justify="space-between" width="100%">
            <Title>Watch an Ethereum address </Title>
            <CaretIcon />
          </TitleRow>
          <DescriptionText>Watch a public address or ENS name</DescriptionText>
        </Column>
      </SheetRow>
    </Container>
  );
}
