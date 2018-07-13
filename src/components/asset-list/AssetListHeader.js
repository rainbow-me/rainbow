import PropTypes from 'prop-types';
import React, { Component, Fragment } from 'react';
import { TouchableOpacity } from 'react-native';
import ActionSheet from 'react-native-actionsheet';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import Icon from '../icons/Icon';
import { Row } from '../layout';
import { H1, Monospace } from '../text';

const BorderLine = styled.View`
  background-color: ${colors.lightGrey};
  border-bottom-left-radius: 2;
  border-top-left-radius: 2;
  height: 2;
  left: 20;
  right: 0;
`;

const ContextMenuButton = styled(TouchableOpacity)`
  ${padding(8, 10)}
`;

const Header = styled(Row)`
  height: 35;
  padding-left: 20;
  padding-right: 20;
`;

const TotalValue = styled(Monospace)`
  color: ${colors.blueGreyDark};
`;

export default class AssetListHeader extends Component {
  static propTypes = {
    section: PropTypes.object,
  }

  handleActionSheetRef = (ref) => { this.ActionSheet = ref; }
  showActionSheet = () => this.ActionSheet.show()

  render = () => {
    const { section: { title, totalValue } } = this.props;

    return (
      <Fragment>
        <Header align="center" justify="space-between">
          <Row align="center">
            <H1>{title}</H1>
            <ContextMenuButton onPress={this.showActionSheet}>
              <Icon name="threeDots" />
            </ContextMenuButton>
          </Row>
          <TotalValue size="large" weight="semibold">
            {`${totalValue}`}
          </TotalValue>
        </Header>
        <BorderLine />
        <ActionSheet
          cancelButtonIndex={3}
          onPress={(index) => { console.log('ON PRESS', index) }}
          options={['Diversity', 'Name', 'Recently Added', 'Cancel']}
          ref={this.handleActionSheetRef}
          title={`Sort ${title.toLowerCase()} by:`}
        />
      </Fragment>
    );
  }
}
