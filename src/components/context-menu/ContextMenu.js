import { omit, pick } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, useCallback, useRef, useState } from 'react';
import ActionSheet from 'react-native-actionsheet';
import { padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';

const ActionSheetProps = [
  'cancelButtonIndex',
  'destructiveButtonIndex',
  'message',
  'onPress',
  'options',
  'tintColor',
  'title',
];

const ContextButton = props => (
  <Centered css={padding(12, 8)} {...props}>
    <Icon name="threeDots" />
  </Centered>
);

function ContextMenu({
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
      if (actionsheetRef.current && actionsheetRef.current.show) {
        actionsheetRef.current.show();
      }
    }, 40);
  }, [isOpen]);

  return (
    <Fragment>
      {onPressActionSheet && (
        <ButtonPressAnimation
          activeOpacity={activeOpacity}
          onPress={handleShowActionSheet}
        >
          {children || <ContextButton {...omit(props, ActionSheetProps)} />}
        </ButtonPressAnimation>
      )}
      <ActionSheet
        {...pick(props, ActionSheetProps)}
        cancelButtonIndex={
          Number.isInteger(cancelButtonIndex)
            ? cancelButtonIndex
            : options.length - 1
        }
        options={dynamicOptions ? dynamicOptions() : options}
        onPress={handlePressActionSheet}
        ref={actionsheetRef}
      />
    </Fragment>
  );
}

ContextMenu.propTypes = {
  activeOpacity: PropTypes.number,
  cancelButtonIndex: PropTypes.number,
  children: PropTypes.node,
  dynamicOptions: PropTypes.func,
  onPressActionSheet: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ContextMenu;
