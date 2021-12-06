import analytics from '@segment/analytics-react-native';
import React, { Fragment, useEffect } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';
import { RainbowButton } from '../buttons';
import { Column, ColumnWithMargins } from '../layout';
import { SheetActionButton } from '../sheet';
import { Text } from '../text';
import BackupIcon from '@rainbow-me/assets/backupIcon.png';
import BackupIconDark from '@rainbow-me/assets/backupIconDark.png';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

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
}: any) {
  const { colors, isDarkMode } = useTheme();
  useEffect(() => {
    analytics.track('BackupSheet shown', {
      category: 'backup',
      label: type,
    });
  }, [type]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Masthead>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <MastheadIcon source={isDarkMode ? BackupIconDark : BackupIcon} />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text align="center" color={colors.dark} size="big" weight="bold">
          {titleText}
        </Text>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <MastheadDescription>{descriptionText}</MastheadDescription>
      </Masthead>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Divider color={colors.rowDividerLight} inset={[0, 42]} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Footer>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RainbowButton
          label={primaryLabel}
          onPress={onPrimaryAction}
          testID={primaryButtonTestId}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
