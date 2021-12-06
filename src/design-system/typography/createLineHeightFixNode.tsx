import React from 'react';
import { Text as NativeText } from 'react-native';

// https://github.com/facebook/react-native/issues/29232#issuecomment-889767516
// On Android, space between lines of multiline text seems to be irregular
// when using certain fonts.
// The workaround posted on GitHub adds 1 to the line height correction node but
// this adds a noticeable amount of space below the baseline. The workaround still
// seems to work as long as the line height differs from the parent node.
// To remove this additional space we've dropped the line height offset to an
// arbitrarily small number that's close to zero.
export const createLineHeightFixNode = (lineHeight: number | undefined) =>
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  android && lineHeight !== undefined ? (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <NativeText style={{ lineHeight: lineHeight - 0.001 }} />
  ) : null;
