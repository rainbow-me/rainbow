import React, { Fragment, useCallback, useRef, useState } from 'react';
import ActionSheet from 'react-native-actionsheet';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { omitFlatten, pickShallow } from '@/helpers/utilities';
import { padding } from '@/styles';
const style = padding.object(12, 8);

const ActionSheetProps = ['cancelButtonIndex', 'destructiveButtonIndex', 'message', 'onPress', 'options', 'tintColor', 'title'];

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
  const actionsheetRef = useRef();
  const [isOpen, setIsOpen] = useState(false);

  const handlePressActionSheet = useCallback(
    buttonIndex => {
      if (onPressActionSheet) {
        onPressActionSheet(buttonIndex);
      }

      setIsOpen(false);
    },
    [onPressActionSheet]
  );

  const handleShowActionSheet = useCallback(() => {
    setTimeout(() => {
      if (isOpen) return;
      setIsOpen(true);
      actionsheetRef.current?.show();
    }, 40);
  }, [isOpen]);

  return (
    <Fragment>
      {onPressActionSheet && (
        <ButtonPressAnimation activeOpacity={activeOpacity} onPress={handleShowActionSheet}>
          {children || <ContextButton {...omitFlatten(props, ActionSheetProps)} />}
        </ButtonPressAnimation>
      )}
      <ActionSheet
        {...pickShallow(props, ActionSheetProps)}
        cancelButtonIndex={Number.isInteger(cancelButtonIndex) ? cancelButtonIndex : options.length - 1}
        onPress={handlePressActionSheet}
        options={dynamicOptions ? dynamicOptions() : options}
        ref={actionsheetRef}
      />
    </Fragment>
  );
}
