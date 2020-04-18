import { omit, pick } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import ActionSheet from 'react-native-actionsheet';
import { withActionSheetManager } from '../hoc';
import { padding } from '../styles';
import { ButtonPressAnimation } from './animations';
import { Icon } from './icons';
import { Centered, Row } from './layout';

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
  };

  static defaultProps = {
    options: [],
  };

  actionSheetRef = null;

  handleActionSheetRef = ref => {
    this.actionSheetRef = ref;
  };

  showActionSheet = () => {
    setTimeout(() => {
      if (this.props.isActionSheetOpen) return;
      this.props.setIsActionSheetOpen(true);
      this.actionSheetRef.show();
    }, 40);
  };

  handlePressActionSheet = buttonIndex => {
    if (this.props.onPressActionSheet) {
      this.props.onPressActionSheet(buttonIndex);
    }

    this.props.setIsActionSheetOpen(false);
  };

  render = () => {
    const funcOptions = this.props.dynamicOptions
      ? this.props.dynamicOptions()
      : false;

    return (
      <Row width={30} height={30}>
        {this.props.onPressActionSheet && (
          <ButtonPressAnimation
            activeOpacity={0.2}
            onPress={this.showActionSheet}
          >
            <Centered
              css={padding(0, 10)}
              height="100%"
              {...omit(this.props, ActionSheetProps)}
            >
              <Icon name="threeDots" />
            </Centered>
          </ButtonPressAnimation>
        )}
        <ActionSheet
          {...pick(this.props, ActionSheetProps)}
          cancelButtonIndex={
            Number.isInteger(this.props.cancelButtonIndex)
              ? this.props.cancelButtonIndex
              : this.props.options.length - 1
          }
          options={funcOptions ? funcOptions : this.props.options}
          onPress={this.handlePressActionSheet}
          ref={this.handleActionSheetRef}
        />
      </Row>
    );
  };
}

export default withActionSheetManager(ContextMenu);
