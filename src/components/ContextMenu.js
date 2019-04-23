import { omit, pick } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import ActionSheet from 'react-native-actionsheet';
import { withActionSheetManager } from '../hoc';
import { padding } from '../styles';
import { ButtonPressAnimation } from './animations';
import { Icon } from './icons';
import { Centered } from './layout';

const ActionSheetProps = [
  'cancelButtonIndex',
  'destructiveButtonIndex',
  'message',
  'onPress',
  'options',
  'tintColor',
  'title',
];

class ContextMenu extends PureComponent {
  static propTypes = {
    cancelButtonIndex: PropTypes.number,
    isActionSheetOpen: PropTypes.bool,
    onPressActionSheet: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.string).isRequired,
    setIsActionSheetOpen: PropTypes.func,
    title: PropTypes.string,
  }

  static defaultProps = {
    options: [],
  }

  actionSheetRef = null

  handleActionSheetRef = (ref) => { this.actionSheetRef = ref; }

  showActionSheet = () => {
    if (this.props.isActionSheetOpen) return;
    this.props.setIsActionSheetOpen(true);
    this.actionSheetRef.show();
  }

  handlePressActionSheet = (buttonIndex) => {
    if (this.props.onPressActionSheet) {
      this.props.onPressActionSheet(buttonIndex);
    }

    this.props.setIsActionSheetOpen(false);
  }

  render = () => (
    <Fragment>
      <ButtonPressAnimation activeOpacity={0.2} onPress={this.showActionSheet}>
        <Centered
          css={padding(0, 10)}
          height="100%"
          {...omit(this.props, ActionSheetProps)}
        >
          <Icon name="threeDots" />
        </Centered>
      </ButtonPressAnimation>
      <ActionSheet
        {...pick(this.props, ActionSheetProps)}
        cancelButtonIndex={this.props.cancelButtonIndex || (this.props.options.length - 1)}
        onPress={this.handlePressActionSheet}
        ref={this.handleActionSheetRef}
      />
    </Fragment>
  )
}

export default withActionSheetManager(ContextMenu);
