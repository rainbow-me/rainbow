import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Clipboard } from 'react-native';
import ToolTip from 'react-native-tooltip';
import { withNavigation } from 'react-navigation';
import { colors } from '../styles';
import { isNewValueForPath } from '../utils';

class CopyTooltip extends PureComponent {
  static propTypes = {
    activeOpacity: PropTypes.number,
    navigation: PropTypes.object,
    textToCopy: PropTypes.string,
    tooltipText: PropTypes.string,
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

  shouldComponentUpdate = (nextProps) => (
    isNewValueForPath(this.props, nextProps, 'textToCopy')
    || isNewValueForPath(this.props, nextProps, 'tooltipText')
  )

  handleCopy = () => Clipboard.setString(this.props.textToCopy)

  handleHideTooltip = () => this.tooltip.hideMenu()

  handleRef = (ref) => { this.tooltip = ref; }

  handleShowTooltip = () => this.tooltip.showMenu()

  render = () => (
    <ToolTip
      {...this.props}
      actions={[{
        onPress: this.handleCopy,
        text: this.props.tooltipText,
      }]}
      activeOpacity={this.props.activeOpacity}
      onPressIn={this.handleShowTooltip}
      ref={this.handleRef}
      underlayColor={colors.transparent}
    />
  )
}

export default withNavigation(CopyTooltip);
