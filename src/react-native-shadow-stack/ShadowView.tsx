import React from 'react';
import { StyleSheet, View } from 'react-native';

const ShadowView = (props: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  if (ios || props.elevation > 0) {
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return <View {...props} />;
  }
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View
      {...props}
      elevation={Math.min(StyleSheet.flatten(props.style).shadowRadius, 5)}
    />
  );
};

export default ShadowView;
