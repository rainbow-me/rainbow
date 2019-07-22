import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Clipboard } from 'react-native';
import ToolTip from 'react-native-tooltip';
import { withNavigation } from 'react-navigation';
import { compose, onlyUpdateForKeys } from 'recompact';
import { colors } from '../styles';

class CopyTooltip extends PureComponent {
  static propTypes = {
    activeOpacity: PropTypes.number,
    navigation: PropTypes.object,
    textToCopy: PropTypes.string,
    tooltipText: PropTypes.string,
    waitForKeyboard: PropTypes.boolean,
  }

  static defaultProps = {
    activeOpacity: 0.666,
    tooltipText: 'Copy',
  }

  tooltip = null

  componentDidUpdate = () => {
    if (this.props.navigation.state.isTransitioning) {
      this.handleHideTooltip();
    }
  }

  componentWillUnmount = () => this.handleHideTooltip()

  handleCopy = () => Clipboard.setString(this.props.textToCopy)

  handleHideTooltip = () => this.tooltip.hideMenu()

  handlePressIn = (isWaitingForKeyboard) => {
    if (isWaitingForKeyboard) {
      setTimeout(() => {
        this.tooltip.showMenu();
      }, 300);
    } else {
      this.tooltip.showMenu();
    }
  }

  handleRef = (ref) => { this.tooltip = ref; }

  render = () => (
    <ToolTip
      {...this.props}
      actions={[{ onPress: this.handleCopy, text: this.props.tooltipText }]}
      activeOpacity={this.props.activeOpacity}
      onPressIn={() => this.handlePressIn(this.props.waitForKeyboard)}
      ref={this.handleRef}
      underlayColor={colors.transparent}
    />
  )
}

export default compose(
  withNavigation,
  onlyUpdateForKeys(['textToCopy', 'tooltipText']),
)(CopyTooltip);
