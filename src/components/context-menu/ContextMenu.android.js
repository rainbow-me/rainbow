import React, { Fragment, useCallback } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { omitFlatten } from '@/helpers/utilities';
import { padding } from '@/styles';
import { showActionSheetWithOptions } from '@/utils';

const ActionSheetProps = ['cancelButtonIndex', 'destructiveButtonIndex', 'message', 'onPress', 'options', 'tintColor', 'title'];

const style = padding.object(12, 8);

const ContextButton = props => (
  <Centered style={style} {...props}>
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
        <TouchableWithoutFeedback activeOpacity={activeOpacity} onPress={handleShowActionSheet} radiusAndroid={20}>
          {children || <ContextButton {...omitFlatten(props, ActionSheetProps)} />}
        </TouchableWithoutFeedback>
      )}
    </Fragment>
  );
}
