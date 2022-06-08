import React, { Fragment, useCallback, useRef, useState } from 'react';
import ActionSheet from 'react-native-actionsheet';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { padding } from '@rainbow-me/styles';
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
  destructiveButtonIndex,
  message,
  tintColor,
  title,
  // eslint-disable-next-line no-unused-vars
  onPress, //to avoid getting onPress in ContextButton
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
        <ButtonPressAnimation
          activeOpacity={activeOpacity}
          onPress={handleShowActionSheet}
        >
          {children || <ContextButton {...props} />}
        </ButtonPressAnimation>
      )}
      <ActionSheet
        cancelButtonIndex={
          Number.isInteger(cancelButtonIndex)
            ? cancelButtonIndex
            : options.length - 1
        }
        destructiveButtonIndex={destructiveButtonIndex}
        message={message}
        onPress={handlePressActionSheet}
        options={dynamicOptions ? dynamicOptions() : options}
        ref={actionsheetRef}
        tintColor={tintColor}
        title={title}
      />
    </Fragment>
  );
}
