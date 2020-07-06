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

const BackupImportedStep = ({ onIcloudBackup, onIgnoreBackup }) => {
  return (
    <Centered direction="column">
      <TopIcon />
      <Title>Would you like to back up?</Title>
      <DescriptionText>
        Don&apos;t lose your wallet! Save an encrypted copy to iCloud.
      </DescriptionText>
      <Divider color={colors.rowDividerLight} inset={[0, 42]} />
      <ColumnWithMargins css={padding(19, 15, 0)} margin={19} width="100%">
        <RainbowButton label="􀙶 Back up to iCloud" onPress={onIcloudBackup} />
        <SheetActionButton
          color={colors.white}
          label="No thanks"
          onPress={onIgnoreBackup}
          size="big"
          textColor={colors.alpha(colors.blueGreyDark, 0.8)}
          testID="backup-sheet-imported-cancel-button"
        />
      </ColumnWithMargins>
    </Centered>
  );
};

export default BackupImportedStep;
