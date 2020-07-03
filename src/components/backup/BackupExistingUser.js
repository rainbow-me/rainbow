import React from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import BackupIcon from '../../assets/backupIcon.png';
import { colors, padding } from '../../styles';
import Divider from '../Divider';
import { RainbowButton } from '../buttons';
import { Centered, ColumnWithMargins } from '../layout';
import { SheetActionButton } from '../sheet';
import { Text } from '../text';

const Title = styled(Text).attrs({
  align: 'center',
  size: 'big',
  weight: 'bold',
})`
  margin-bottom: 11;
`;

const TopIcon = styled(FastImage).attrs({
  resizeMode: FastImage.resizeMode.contain,
  source: BackupIcon,
})`
  height: 74;
  margin-bottom: -1;
  margin-top: 8;
  width: 75;
`;

const DescriptionText = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'large',
})`
  padding-horizontal: 42;
  padding-bottom: 30;
`;

const BackupExistingUser = ({ onBackupNow, onAlreadyBackedUp }) => {
  return (
    <Centered direction="column">
      <TopIcon />
      <Title>Back up your wallets</Title>
      <DescriptionText>
        Don&apos;t risk your money! Back up your wallet in case you lose this
        device.
      </DescriptionText>
      <Divider color={colors.rowDividerLight} inset={[0, 42]} />
      <ColumnWithMargins css={padding(19, 15, 0)} margin={19} width="100%">
        <RainbowButton label="Back up now" onPress={onBackupNow} />
        <SheetActionButton
          color={colors.white}
          label="􀁣 Already backed up"
          onPress={onAlreadyBackedUp}
          size="big"
          textColor={colors.alpha(colors.blueGreyDark, 0.8)}
        />
      </ColumnWithMargins>
    </Centered>
  );
};

export default BackupExistingUser;
