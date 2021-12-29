import { omit } from 'lodash';
import React, { Fragment, useCallback } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { padding } from '@rainbow-me/styles';
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

const css = padding.object(12, 8);

const ContextButton = props => (
  <Centered css={css} {...props}>
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
}) {
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
    <Fragment>
      {onPressActionSheet && (
        <TouchableWithoutFeedback
          activeOpacity={activeOpacity}
          onPress={handleShowActionSheet}
          radiusAndroid={20}
        >
          {children || <ContextButton {...omit(props, ActionSheetProps)} />}
        </TouchableWithoutFeedback>
      )}
    </Fragment>
  );
}
