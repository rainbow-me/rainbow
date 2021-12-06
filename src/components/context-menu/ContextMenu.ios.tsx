import { omit, pick } from 'lodash';
import React, { Fragment, useCallback, useRef, useState } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import ActionSheet from 'react-native-actionsheet';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

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
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'show' does not exist on type 'never'.
      actionsheetRef.current?.show();
    }, 40);
  }, [isOpen]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      {onPressActionSheet && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ButtonPressAnimation
          activeOpacity={activeOpacity}
          onPress={handleShowActionSheet}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {children || <ContextButton {...omit(props, ActionSheetProps)} />}
        </ButtonPressAnimation>
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ActionSheet
        {...pick(props, ActionSheetProps)}
        cancelButtonIndex={
          Number.isInteger(cancelButtonIndex)
            ? cancelButtonIndex
            : options.length - 1
        }
        onPress={handlePressActionSheet}
        options={dynamicOptions ? dynamicOptions() : options}
        ref={actionsheetRef}
      />
    </Fragment>
  );
}
