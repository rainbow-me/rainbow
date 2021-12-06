import React from 'react';
import { View } from 'react-native';

const pink = 'rgba(255,0,0,0.15)';

export const Guide = () => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <View style={{ backgroundColor: pink, height: 16 }} />
);
