import React from 'react';
import { View } from 'react-native';

export const Placeholder = ({
  height = 40,
  width,
  flexGrow,
}: {
  flexGrow?: number;
  height?: number;
  width?: number | '100%';
}) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <View
    style={{
      backgroundColor: '#eee',
      borderColor: '#aaa',
      borderWidth: 1,
      flexGrow,
      height,
      width,
    }}
  />
);
