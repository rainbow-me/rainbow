import { useBottomSheet } from '@gorhom/bottom-sheet';
import React, { useCallback } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

const BottomSheetBackground = () => {
  //#region hooks
  const { close } = useBottomSheet();
  //#endregion

  //#region callbacks
  const handleOnPress = useCallback(() => {
    close();
  }, [close]);
  //#endregion

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TouchableWithoutFeedback onPress={handleOnPress} style={styles.container}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View style={styles.container} />
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default BottomSheetBackground;
