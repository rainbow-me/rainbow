import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Clipboard, View } from 'react-native';
import Button from './Button';
import { withAppState } from '../../hoc';
import { colors } from '../../styles';
import FastImage from 'react-native-fast-image';
import AddContactIcon from '../../assets/addContactIcon.png';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';

const AddIcon = styled(FastImage)`
  width: 19px;
  height: 14.7px;
  margin: 1.525px;
`;

const EditIcon = styled(View)`
  height: 30px;
  padding-right: 4px;
  justify-content: center;
`;

class AddContactButton extends PureComponent {
  static propTypes = {
    appState: PropTypes.string,
    onPress: PropTypes.func.isRequired,
  }

  render() {
    return (
      <View>
        {!this.props.edit ? (
          <Button
            backgroundColor={colors.sendScreen.brightBlue}
            onPress={this.props.onPress}
            size="small"
            type="pill"
          >
            <AddIcon source={AddContactIcon} />
          </Button>
        ) : (
          <ButtonPressAnimation activeOpacity={0.2} onPress={this.props.onPress}>
            <EditIcon>
              <Icon name="threeDots" />
            </EditIcon>
          </ButtonPressAnimation>
          )}
      </View>
    );
  }
}

export default withAppState(AddContactButton);
