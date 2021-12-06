import React from 'react';
import { Centered, ColumnWithMargins } from '../layout';
import { Emoji, Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { neverRerender } from '@rainbow-me/utils';

const NoResults = () => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ColumnWithMargins centered margin={3}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Emoji lineHeight="none" name="ghost" size={42} />
      </Centered>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text
        color={colors.alpha(colors.blueGreyDark, 0.4)}
        size="lmedium"
        weight="medium"
      >
        Nothing here!
      </Text>
    </ColumnWithMargins>
  );
};

export default neverRerender(NoResults);
