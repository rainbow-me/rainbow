import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Clipboard } from 'react-native';
import Button from './Button';
import { withAppState } from '../../hoc';
import { colors } from '../../styles';
import { isValidAddress } from '../../helpers/validators';

class AddContactButton extends PureComponent {
  static propTypes = {
    appState: PropTypes.string,
    onPress: PropTypes.func.isRequired,
  }

  render() {
    return (
      <Button
        backgroundColor={colors.sendScreen.brightBlue}
        onPress={this.props.onPress}
        size="small"
        type="pill"
      >
        {this.props.edit ? `Edit` : `Add`}
      </Button>
    );
  }
}

export default withAppState(AddContactButton);
