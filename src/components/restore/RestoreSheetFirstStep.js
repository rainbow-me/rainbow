import { forEach } from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import WalletBackupTypes from '../../helpers/walletBackupTypes';
import { deviceUtils } from '../../utils';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Column, Row, RowWithMargins } from '../layout';
import { GradientText, Text } from '../text';
import { colors } from '@rainbow-me/styles';

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

const RainbowText = styled(GradientText).attrs({
  angle: false,
  colors: ['#FFB114', '#FF54BB', '#7EA4DE'],
  end: { x: 0, y: 0.5 },
  start: { x: 1, y: 0.5 },
  steps: [0, 0.774321, 1],
})``;

const TextIcon = styled(Text).attrs({
  size: 29,
  weight: 'medium',
})`
  height: 35;
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

const RestoreSheetFirstStep = ({
  onIcloudRestore,
  onManualRestore,
  onWatchAddress,
  userData,
}) => {
  const walletsBackedUp = useMemo(() => {
    let count = 0;
    forEach(userData?.wallets, wallet => {
      if (wallet.backedUp && wallet.backupType === WalletBackupTypes.cloud) {
        count++;
      }
    });
    return count;
  }, [userData]);

  return (
    <Container>
      {walletsBackedUp > 0 && (
        <React.Fragment>
          <SheetRow as={ButtonPressAnimation} onPress={onIcloudRestore}>
            <Column>
              <Row>
                <RainbowText>
                  <TextIcon>􀌍</TextIcon>
                </RainbowText>
              </Row>
              <TitleRow>
                <RainbowText>
                  <Title>Restore from iCloud</Title>
                </RainbowText>
                <CaretIcon />
              </TitleRow>
              <DescriptionText>
                {`You have ${walletsBackedUp} ${
                  walletsBackedUp > 1 ? 'wallets' : 'wallet'
                } backed up`}
              </DescriptionText>
            </Column>
          </SheetRow>
          <Divider color={colors.rowDividerExtraLight} inset={[0, 30]} />
        </React.Fragment>
      )}
      <SheetRow as={ButtonPressAnimation} onPress={onManualRestore}>
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
};

export default RestoreSheetFirstStep;
