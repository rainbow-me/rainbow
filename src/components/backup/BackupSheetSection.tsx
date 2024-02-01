import React, { Fragment, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import Divider from '../Divider';
import { RainbowButton } from '../buttons';
import { Column, ColumnWithMargins } from '../layout';
import { SheetActionButton } from '../sheet';
import { Text } from '../text';
import { analytics } from '@/analytics';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { Bleed, Separator } from '@/design-system';
import RainbowButtonTypes from '../buttons/rainbow-button/RainbowButtonTypes';

const Footer = styled(ColumnWithMargins).attrs({
  margin: 19,
})({
  ...padding.object(32, 15, 32),
  width: '100%',
});

const Masthead = styled(Column).attrs({
  align: 'center',
  justify: 'start',
})({
  ...padding.object(32, 24, 40),
  flex: 1,
});

const MastheadIcon = styled(ImgixImage).attrs({
  resizeMode: ImgixImage.resizeMode.contain,
})({
  height: 74,
  marginBottom: -1,
  width: 75,
  size: 75,
});

type BackupSheetSectionProps = {
  headerIcon: React.ReactNode;
  onPrimaryAction: () => Promise<void>;
  onSecondaryAction: () => void;
  primaryButtonTestId: string;
  primaryLabel: string;
  secondaryButtonTestId: string;
  secondaryLabel: string;
  titleText: string;
  type: string;
};

export default function BackupSheetSection({
  headerIcon,
  onPrimaryAction,
  onSecondaryAction,
  primaryButtonTestId,
  primaryLabel,
  secondaryButtonTestId,
  secondaryLabel,
  titleText,
  type,
}: BackupSheetSectionProps) {
  const { colors } = useTheme();
  useEffect(() => {
    analytics.track('BackupSheet shown', {
      category: 'backup',
      label: type,
    });
  }, [type]);

  return (
    <Fragment>
      <Masthead>
        {headerIcon}
        <Text align="center" color={colors.dark} size="bigger" weight="heavy">
          {titleText}
        </Text>
      </Masthead>
      <Bleed horizontal="24px">
        <Separator thickness={1} color="separator" />
      </Bleed>
      <Footer>
        <RainbowButton
          label={primaryLabel}
          onPress={onPrimaryAction}
          testID={primaryButtonTestId}
        />
        <SheetActionButton
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
