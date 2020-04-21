import Clipboard from '@react-native-community/clipboard';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { checkIsValidAddress } from '../../helpers/validators';
import { withAppState } from '../../hoc';
import { colors } from '../../styles';
import Button from './Button';

class PasteAddressButton extends PureComponent {
  static propTypes = {
    appState: PropTypes.string,
    onPress: PropTypes.func.isRequired,
  };

  state = { clipboardContents: null };

  componentDidMount() {
    this.getClipboardContents();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.appState === 'background' &&
      this.props.appState === 'active'
    ) {
      this.getClipboardContents();
    }
  }

  getClipboardContents = async () =>
    Clipboard.getString().then(this.setClipboardContents);

  handlePress = () => {
    if (this.state.clipboardContents) {
      this.props.onPress(this.state.clipboardContents);
    }
  };

  setClipboardContents = async clipboardContents => {
    if (await checkIsValidAddress(clipboardContents)) {
      this.setState({ clipboardContents });
    }
  };

  render() {
    const { clipboardContents } = this.state;

    return (
      <Button
        backgroundColor={
          clipboardContents ? colors.sendScreen.brightBlue : '#D2D3D7'
        }
        disabled={!clipboardContents}
        onPress={this.handlePress}
        size="small"
        type="pill"
      >
        Paste
      </Button>
    );
  }
}

export default withAppState(PasteAddressButton);
