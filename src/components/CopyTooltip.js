import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Clipboard } from 'react-native';
import ToolTip from 'react-native-tooltip';
import { withNavigation } from 'react-navigation';
import { colors } from '../styles';

class CopyTooltip extends Component {
  static propTypes = {
    navigation: PropTypes.object,
    textToCopy: PropTypes.string,
  }

  tooltip = null

  componentDidUpdate = () => {
    if (this.props.navigation.state.isTransitioning) {
      this.handleHideTooltip();
    }
  }

  componentWillUnmount = () => this.handleHideTooltip()

  handleCopy = () => Clipboard.setString(this.props.textToCopy)
  handleRef = (ref) => { this.tooltip = ref; }
  handleHideTooltip = () => this.tooltip.hideMenu()

  render = () => (
    <ToolTip
      {...this.props}
      actions={[{ onPress: this.handleCopy, text: 'Copy' }]}
      ref={this.handleRef}
      underlayColor={colors.transparent}
    />
  )
}

export default withNavigation(CopyTooltip);
