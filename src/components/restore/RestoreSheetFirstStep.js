import { isEmpty } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import BackupIcon from '../../assets/backupIcon.png';
import Caret from '../../assets/family-dropdown-arrow.png';
import WalletBackupTypes from '../../helpers/walletBackupTypes';
import { colors, padding } from '../../styles';
import Divider from '../Divider';

import { ButtonPressAnimation } from '../animations';
import { Column, Row } from '../layout';
import { Text } from '../text';
const CaretIcon = styled(FastImage).attrs({
  source: Caret,
  tintColor: colors.blueGreyDark,
})`
  height: 18;
  width: 10;
`;

const SheetRow = styled(Row).attrs({
  scaleTo: 0.98,
})`
  ${padding(19, 19, 0)};
`;

const TextIcon = styled(Text).attrs({
  size: 'h3',
})`
  width: 38;
  height: 38;
  margin-bottom: 7;
  margin-top: 0;
`;

const Title = styled(Text).attrs({
  lineHeight: 'loosest',
  size: 'larger',
  weight: 'bold',
})`
  margin-bottom: 6;
`;

const IcloudIcon = styled(FastImage).attrs({
  source: BackupIcon,
})`
  height: 45;
  width: 45;
  margin-bottom: 7;
  margin-left: -7;
  margin-top: 0;
`;

const DescriptionText = styled(Text).attrs({
  align: 'left',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'smedium',
})`
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
    userData &&
      Object.keys(userData.wallets).forEach(key => {
        const wallet = userData.wallets[key];
        if (wallet.backedUp && wallet.backupType === WalletBackupTypes.cloud) {
          count++;
        }
      });
    return count;
  }, [userData]);

  const onIcloudRestorePress = useCallback(() => {
    onIcloudRestore();
  }, [onIcloudRestore]);

  return (
    <React.Fragment>
      <Column direction="column" paddingBottom={40}>
        <SheetRow
          as={ButtonPressAnimation}
          onPress={onIcloudRestorePress}
          // disabled={walletsBackedUp < 1}
        >
          <Column>
            <IcloudIcon />
            <Title>Restore from iCloud </Title>
            <DescriptionText>
              {isEmpty(userData)
                ? ' Checking iCloud for backups...'
                : walletsBackedUp > 0
                ? `You have ${walletsBackedUp} ${
                    walletsBackedUp > 1 ? 'wallets' : 'wallet'
                  } backed up`
                : `You don't have any wallets backed up`}
            </DescriptionText>
          </Column>
          <Row flex={1} justify="end" align="center" marginRight={19}>
            <CaretIcon />
          </Row>
        </SheetRow>
        <Divider color={colors.rowDividerLight} inset={[0, 10]} />
        <SheetRow as={ButtonPressAnimation} onPress={onManualRestore}>
          <Column>
            <TextIcon color={colors.swapPurple}>􀑚</TextIcon>
            <Title css={padding(0, 80, 0, 0)}>
              Restore with a recovery phrase or private key
            </Title>
            <DescriptionText css={padding(0, 80, 24, 0)}>
              Use your recovery phrase from Rainbow or any other walet
            </DescriptionText>
          </Column>
          <Row
            flex={1}
            justify="end"
            align="center"
            marginLeft={0}
            marginRight={19}
          >
            <CaretIcon />
          </Row>
        </SheetRow>
        <Divider color={colors.rowDividerLight} inset={[0, 30]} />

        <SheetRow
          as={ButtonPressAnimation}
          scaleTo={0.9}
          onPress={onWatchAddress}
        >
          <Column>
            <TextIcon color={colors.mintDark}>􀒒</TextIcon>
            <Title>Watch an Ethereum address </Title>
            <DescriptionText>
              Watch a public address or ENS name
            </DescriptionText>
          </Column>
          <Row flex={1} justify="end" align="center" marginRight={19}>
            <CaretIcon />
          </Row>
        </SheetRow>
      </Column>
    </React.Fragment>
  );
};

export default RestoreSheetFirstStep;
