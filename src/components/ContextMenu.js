import PropTypes from 'prop-types';
import React, { Component, Fragment } from 'react';
import ActionSheet from 'react-native-actionsheet';
import styled from 'styled-components/primitives';
import { padding } from '../styles';
import { ButtonPressAnimation } from './buttons';
import Icon from './icons/Icon';
import { Centered } from './layout';

const ContextMenuButton = styled(Centered)`
  ${padding(0, 10)}
  height: 100%;
`;

export default class ContextMenu extends Component {
  static propTypes = {
    title: PropTypes.string,
  }

  handleActionSheetRef = (ref) => { this.ActionSheet = ref; }
  showActionSheet = () => this.ActionSheet.show()

  render = () => (
    <Fragment>
      <ButtonPressAnimation activeOpacity={0.2} onPress={this.showActionSheet}>
        <ContextMenuButton>
          <Icon name="threeDots" />
        </ContextMenuButton>
      </ButtonPressAnimation>
      <ActionSheet
        {...this.props}
        ref={this.handleActionSheetRef}
      />
    </Fragment>
  )
}
