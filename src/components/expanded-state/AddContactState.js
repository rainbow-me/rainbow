import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { InteractionManager, TextInput, KeyboardAvoidingView, View } from 'react-native';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
} from 'recompact';
import { AssetPanel, AssetPanelAction, AssetPanelHeader } from './asset-panel';
import FloatingPanels from './FloatingPanels';
import { withAccountData, withAccountSettings } from '../../hoc';
import { ethereumUtils, deviceUtils } from '../../utils';
import styled from 'styled-components/primitives';
import { Input } from '../inputs';
import { colors } from '../../styles';
import { Button } from '../buttons';
import { Monospace } from '../text';

const TopMenu = styled(View)`
  justify-content: center;
  align-items: center;
  width: ${deviceUtils.dimensions.width - 110};
  padding: 24px;
`;

const Container = styled(View)`
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const NameCircle = styled(View)`
  justify-content: center;
  align-items: center;
  height: 60px;
  width: 60px;
  border-radius: 30px;
  background-color: ${colors.avatar1}
`;


class AddContactState extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      value: "",
    };
  }

  format = (string) => (
    this.props.format
      ? this.props.format(string)
      : string
  )

  onChange = (event) => {
    const { nativeEvent } = event;

    const value = this.format(nativeEvent.text);
    console.log(value);
    if (value !== this.value) {
      this.setState({ value });
    }
  }

  render() {
    return <KeyboardAvoidingView behavior="padding">
      <FloatingPanels
        width={100}
      >
        <Container>
          <AssetPanel>
            <TopMenu>
              <NameCircle />
              <Input
                autoFocus={true}
                color={colors.blueGreyDark}
                family={'SFProDisplay'}

                // maxLength={maxLength}
                // onBlur={this.onBlur}
                onChange={this.onChange}
                // onFocus={this.onFocus}
                placeholder={'Name'}
                size="h3"
                value={this.format(String(this.props.value || ''))}
                textAlign={'center'}
              />
              <Monospace>
                {this.props.asset.to}
              </Monospace>
              <Button backgroundColor={colors.appleBlue} width={215}>
                Add Contact
            </Button>
            </TopMenu>
          </AssetPanel>
        </Container>
      </FloatingPanels>
    </KeyboardAvoidingView>
  }
};

AddContactState.propTypes = {
  onPressSend: PropTypes.func,
  price: PropTypes.string,
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

export default compose(
  withAccountData,
  withAccountSettings,
  withProps(({
    asset: {
      address,
      name,
      symbol,
      ...asset
    },
    assets,
    nativeCurrencySymbol,
  }) => {
    const selectedAsset = ethereumUtils.getAsset(assets, address);
    return {
      price: get(selectedAsset, 'native.price.display', null),
      subtitle: get(selectedAsset, 'balance.display', symbol),
      title: name,
    };
  }),
  withHandlers({
    onPressSend: ({ navigation, asset: { address } }) => () => {
      navigation.goBack();

      InteractionManager.runAfterInteractions(() => {
        navigation.navigate('SendSheet', { asset: address });
      });
    },
  }),
  onlyUpdateForKeys(['price', 'subtitle']),
)(AddContactState);
