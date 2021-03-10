import analytics from '@segment/analytics-react-native';
import React, { Fragment, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import Divider from '../Divider';
import { RainbowButton } from '../buttons';
import { Column, ColumnWithMargins } from '../layout';
import { SheetActionButton } from '../sheet';
import { Text } from '../text';
import BackupIcon from '@rainbow-me/assets/backupIcon.png';
import BackupIconDark from '@rainbow-me/assets/backupIconDark.png';
import { ImgixImage } from '@rainbow-me/images';
import { padding } from '@rainbow-me/styles';
import { deviceUtils } from '@rainbow-me/utils';

const Footer = styled(ColumnWithMargins).attrs({
  margin: 19,
})`
  ${padding(19, 15, 21)};
  width: 100%;
`;

const Masthead = styled(Column).attrs({
  align: 'center',
  justify: 'start',
})`
  flex: 1;
  padding-top: 8;
`;

const MastheadDescription = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'large',
}))`
  ${padding(12, 42, 30)};
`;

const MastheadIcon = styled(ImgixImage).attrs({
  resizeMode: ImgixImage.resizeMode.contain,
})`
  height: 74;
  margin-bottom: -1;
  width: 75;
`;

export default function BackupSheetSection({
  descriptionText,
  onPrimaryAction,
  onSecondaryAction,
  primaryButtonTestId,
  primaryLabel,
  secondaryButtonTestId,
  secondaryLabel,
  titleText,
  type,
}) {
  const { colors, isDarkMode } = useTheme();
  useEffect(() => {
    analytics.track('BackupSheet shown', {
      category: 'backup',
      label: type,
    });
  }, [type]);

  const maxButtonWidth = deviceUtils.dimensions.width - 30;

  return (
    <Fragment>
      <Masthead>
        <MastheadIcon source={isDarkMode ? BackupIconDark : BackupIcon} />
        <Text align="center" color={colors.dark} size="big" weight="bold">
          {titleText}
        </Text>
        <MastheadDescription>{descriptionText}</MastheadDescription>
      </Masthead>
      <Divider color={colors.rowDividerLight} inset={[0, 42]} />
      <Footer>
        <RainbowButton
          label={primaryLabel}
          onPress={onPrimaryAction}
          testID={primaryButtonTestId}
        />
        <SheetActionButton
          androidWidth={maxButtonWidth}
          color={colors.white}
          label={secondaryLabel}
          onPress={onSecondaryAction}
          size="big"
          testID={secondaryButtonTestId}
          textColor={colors.alpha(colors.blueGreyDark, 0.8)}
        />
      </Footer>
    </Fragment>
  );
}
