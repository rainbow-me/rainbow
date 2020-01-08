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
    setSafeTimeout: PropTypes.func,
    textToCopy: PropTypes.string,
    tooltipText: PropTypes.string,
  };

  static defaultProps = {
    activeOpacity: 0.666,
    tooltipText: 'Copy',
  };

  componentDidUpdate = () => {
    if (this.props.navigation.state.isTransitioning) {
      this.handleHideTooltip();
    }
  };

  componentWillUnmount = () => this.handleHideTooltip();

  tooltip = null;

  handleCopy = () => Clipboard.setString(this.props.textToCopy);

  handleHideTooltip = () => this.tooltip.hideMenu();

  handlePress = () => this.tooltip.showMenu();

  handleRef = ref => {
    this.tooltip = ref;
  };

  render = () => (
    <ToolTip
      {...this.props}
      actions={[{ onPress: this.handleCopy, text: this.props.tooltipText }]}
      activeOpacity={this.props.activeOpacity}
      onPress={this.handlePress}
      ref={this.handleRef}
      underlayColor={colors.transparent}
    />
  );
}

export default compose(
  withNavigation,
  onlyUpdateForKeys(['textToCopy', 'tooltipText'])
)(CopyTooltip);
