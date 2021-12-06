import React from 'react';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import Monospace from './Monospace';

export default function ErrorText({ color, error }: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <RowWithMargins align="center" margin={9}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Icon color={color || colors.red} name="warning" />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Monospace
        color={color || colors.red}
        lineHeight="looser"
        size="lmedium"
        weight="medium"
      >
        {error}
      </Monospace>
    </RowWithMargins>
  );
}
