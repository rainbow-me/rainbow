import React from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import BackupIcon from '../../assets/backupIcon.png';
import Divider from '../Divider';
import { RainbowButton } from '../buttons';
import { Centered, ColumnWithMargins } from '../layout';
import { SheetActionButton } from '../sheet';
import { Text } from '../text';
import { colors, padding } from '@rainbow-me/styles';

const Title = styled(Text).attrs({
  align: 'center',
  size: 'big',
  weight: 'bold',
})`
  margin-bottom: 12;
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

const BackupSheetSection = ({
  titleText,
  descriptionText,
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel,
  secondaryLabel,
}) => {
  return (
    <Centered direction="column" paddingBottom={15}>
      <TopIcon />
      <Title>{titleText}</Title>
      <DescriptionText>{descriptionText}</DescriptionText>
      <Divider color={colors.rowDividerLight} inset={[0, 42]} />
      <ColumnWithMargins css={padding(19, 15, 0)} margin={19} width="100%">
        <RainbowButton label={primaryLabel} onPress={onPrimaryAction} />
        <SheetActionButton
          color={colors.white}
          label={secondaryLabel}
          onPress={onSecondaryAction}
          size="big"
          textColor={colors.alpha(colors.blueGreyDark, 0.8)}
        />
      </ColumnWithMargins>
    </Centered>
  );
};

export default BackupSheetSection;
