import React, { Fragment, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { RainbowButton } from '../buttons';
import { Column, ColumnWithMargins } from '../layout';
import { SheetActionButton } from '../sheet';
import { Text } from '../text';
import { analytics } from '@/analytics';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { Bleed, Separator } from '@/design-system';

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

type MaybePromise<T> = T | Promise<T>;

type BackupSheetSectionProps = {
  headerIcon?: React.ReactNode;
  onPrimaryAction: () => MaybePromise<void>;
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
        <RainbowButton label={primaryLabel} onPress={onPrimaryAction} testID={primaryButtonTestId} />
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
