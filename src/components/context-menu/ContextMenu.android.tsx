import { omit } from 'lodash';
import React, { Fragment, useCallback } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { Icon } from '../icons';
import { Centered } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { showActionSheetWithOptions } from '@rainbow-me/utils';

const ActionSheetProps = [
  'cancelButtonIndex',
  'destructiveButtonIndex',
  'message',
  'onPress',
  'options',
  'tintColor',
  'title',
];

const ContextButton = (props: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Centered css={padding(12, 8)} {...props}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Icon name="threeDots" />
  </Centered>
);

export default function ContextMenu({
  activeOpacity = 0.2,
  cancelButtonIndex,
  children,
  dynamicOptions,
  onPressActionSheet,
  options = [],
  ...props
}: any) {
  const handlePressActionSheet = useCallback(
    buttonIndex => {
      if (onPressActionSheet) {
        onPressActionSheet(buttonIndex);
      }
    },
    [onPressActionSheet]
  );

  const handleShowActionSheet = useCallback(() => {
    showActionSheetWithOptions(
      {
        ...(Number.isInteger(cancelButtonIndex) ? { cancelButtonIndex } : {}),
        options: dynamicOptions ? dynamicOptions() : options,
      },
      handlePressActionSheet
    );
  }, [cancelButtonIndex, dynamicOptions, handlePressActionSheet, options]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      {onPressActionSheet && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <TouchableWithoutFeedback
          // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
          activeOpacity={activeOpacity}
          onPress={handleShowActionSheet}
          radiusAndroid={20}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {children || <ContextButton {...omit(props, ActionSheetProps)} />}
        </TouchableWithoutFeedback>
      )}
    </Fragment>
  );
}
