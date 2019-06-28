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
import { ethereumUtils } from '../../utils';
import styled from 'styled-components/primitives';
import { Input } from '../inputs';
import { colors } from '../../styles';

const TopMenu = styled(View)`
  justify-content: center;
  align-items: center;
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


const AddContactState = ({
  onPressSend,
  price,
  subtitle,
  title,
}) => (
    <KeyboardAvoidingView behavior="padding">
      <Container>
        <FloatingPanels
          width={66}
        >
          <AssetPanel>
            <TopMenu>
              <NameCircle />
              <Input
                autoFocus={true}
                color={colors.blueGreyDark}
                family="SFMono"
                // maxLength={maxLength}
                // onBlur={this.onBlur}
                // onChange={this.onChange}
                // onFocus={this.onFocus}
                // placeholder={placeholder}
                size="h3"
                // value={this.format(String(this.props.value || ''))}
                textAlign={'center'}
              />
            </TopMenu>
            <AssetPanelAction
              icon="send"
              label="Send to..."
              onPress={onPressSend}
            />
          </AssetPanel>
        </FloatingPanels>
      </Container>
    </KeyboardAvoidingView>
  );

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
