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
  android && lineHeight !== undefined ? <NativeText style={{ lineHeight: lineHeight - 0.001 }} /> : null;
